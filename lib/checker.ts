import type { RowDataPacket } from 'mysql2';
import pool from './db';
import { sendMail } from './mail';

interface ProgramRow extends RowDataPacket {
  id: number;
  name: string;
  is_down: number;
  first_fail_at: string | null;
}

interface UrlRow extends RowDataPacket {
  id: number;
  program_id: number;
  url: string;
}

async function checkUrl(url: string): Promise<{ status: number | null; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 gloomymonitor/1.0',
      },
    });
    return { status: res.status, error: null };
  } catch (e) {
    return { status: null, error: e instanceof Error ? e.message : 'fetch failed' };
  } finally {
    clearTimeout(timer);
  }
}

async function logIncidents(
  newlyDown: { id: number; name: string; fails: string[] }[],
  newlyRecovered: { id: number; name: string }[]
) {
  for (const d of newlyDown) {
    await pool.query(
      "INSERT INTO incidents (program_id, program_name, type, detail) VALUES (?, ?, 'down', ?)",
      [d.id, d.name, d.fails.join('\n')]
    );
  }
  for (const r of newlyRecovered) {
    await pool.query(
      "INSERT INTO incidents (program_id, program_name, type, detail) VALUES (?, ?, 'recovered', NULL)",
      [r.id, r.name]
    );
  }
}

async function notify(
  newlyDown: { id: number; name: string; fails: string[] }[],
  newlyRecovered: { id: number; name: string }[]
) {
  const [recipients] = await pool.query<RowDataPacket[]>('SELECT email FROM recipients');
  const to = recipients.map((r) => r.email as string);
  if (to.length === 0) return;

  const lines: string[] = [];
  if (newlyDown.length > 0) {
    lines.push('[장애 발생]');
    for (const d of newlyDown) {
      lines.push(`- ${d.name}`);
      for (const f of d.fails) lines.push(`   ${f}`);
    }
    lines.push('');
  }
  if (newlyRecovered.length > 0) {
    lines.push('[복구됨]');
    for (const r of newlyRecovered) lines.push(`- ${r.name}`);
  }

  const subjectParts: string[] = [];
  if (newlyDown.length) subjectParts.push(`장애 ${newlyDown.length}건`);
  if (newlyRecovered.length) subjectParts.push(`복구 ${newlyRecovered.length}건`);
  const subject = `[gloomymonitor] ${subjectParts.join(', ')}`;

  try {
    await sendMail(to, subject, lines.join('\n'));
    await pool.query(
      'UPDATE settings SET last_mail_ok=1, last_mail_error=NULL, last_mail_at=NOW() WHERE id=1'
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'sendMail failed';
    console.error('[gloomymonitor] sendMail failed', e);
    await pool.query(
      'UPDATE settings SET last_mail_ok=0, last_mail_error=?, last_mail_at=NOW() WHERE id=1',
      [message.slice(0, 500)]
    );
  }
}

export async function runCheckCycle(): Promise<void> {
  const [settingsRows] = await pool.query<RowDataPacket[]>(
    'SELECT down_threshold_seconds FROM settings WHERE id=1'
  );
  const thresholdSeconds = settingsRows[0]?.down_threshold_seconds ?? 0;

  const [programs] = await pool.query<ProgramRow[]>(
    'SELECT id, name, is_down, first_fail_at FROM programs'
  );
  const [urls] = await pool.query<UrlRow[]>('SELECT id, program_id, url FROM program_urls');

  const urlsByProgram = new Map<number, UrlRow[]>();
  for (const u of urls) {
    const list = urlsByProgram.get(u.program_id) ?? [];
    list.push(u);
    urlsByProgram.set(u.program_id, list);
  }

  const newlyDown: { id: number; name: string; fails: string[] }[] = [];
  const newlyRecovered: { id: number; name: string }[] = [];

  for (const program of programs) {
    const programUrls = urlsByProgram.get(program.id) ?? [];
    if (programUrls.length === 0) continue;

    let anyFail = false;
    const failDetails: string[] = [];

    for (const u of programUrls) {
      const { status, error } = await checkUrl(u.url);
      if (status !== 200) {
        anyFail = true;
        const detail = `${u.url} -> ${status ?? 'ERROR'}${error ? ` (${error})` : ''}`;
        failDetails.push(detail);
        console.error(`[gloomymonitor] ${new Date().toISOString()} check failed: ${detail}`);
      }
      await pool.query(
        'UPDATE program_urls SET last_status=?, last_checked_at=NOW(), last_error=? WHERE id=?',
        [status, error, u.id]
      );
    }

    const wasDown = !!program.is_down;

    if (anyFail) {
      if (!program.first_fail_at) {
        await pool.query('UPDATE programs SET first_fail_at=NOW() WHERE id=?', [program.id]);
      }
      const [durRows] = await pool.query<RowDataPacket[]>(
        'SELECT TIMESTAMPDIFF(SECOND, first_fail_at, NOW()) AS down_seconds FROM programs WHERE id=?',
        [program.id]
      );
      const downSeconds = durRows[0]?.down_seconds ?? 0;

      if (!wasDown && downSeconds >= thresholdSeconds) {
        newlyDown.push({ id: program.id, name: program.name, fails: failDetails });
        await pool.query('UPDATE programs SET is_down=1 WHERE id=?', [program.id]);
      }
    } else {
      if (program.first_fail_at) {
        await pool.query('UPDATE programs SET first_fail_at=NULL WHERE id=?', [program.id]);
      }
      if (wasDown) {
        newlyRecovered.push({ id: program.id, name: program.name });
        await pool.query('UPDATE programs SET is_down=0 WHERE id=?', [program.id]);
      }
    }
  }

  if (newlyDown.length > 0 || newlyRecovered.length > 0) {
    await logIncidents(newlyDown, newlyRecovered);
    await notify(newlyDown, newlyRecovered);
  }
}

async function getIntervalMs(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT interval_seconds FROM settings WHERE id=1'
  );
  const seconds = rows[0]?.interval_seconds ?? 60;
  return Math.max(5, seconds) * 1000;
}

let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;

function runGuarded(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = runCheckCycle()
    .catch((e) => {
      console.error('[gloomymonitor] check cycle failed', e);
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

async function tick() {
  await runGuarded();
  const intervalMs = await getIntervalMs().catch(() => 60000);
  timer = setTimeout(tick, intervalMs);
}

declare global {
  // eslint-disable-next-line no-var
  var __siteMonitorStarted: boolean | undefined;
}

export function startChecker() {
  if (globalThis.__siteMonitorStarted) return;
  globalThis.__siteMonitorStarted = true;
  tick();
}

/** Runs a check immediately and restarts the periodic timer from this moment. */
export async function restartChecker(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  await tick();
}

/** Manual, on-demand check that doesn't touch the periodic schedule. */
export function checkNow(): Promise<void> {
  return runGuarded();
}
