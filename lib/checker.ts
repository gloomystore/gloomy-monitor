import type { RowDataPacket } from 'mysql2';
import pool from './db';
import { sendMail } from './mail';

interface ProgramRow extends RowDataPacket {
  id: number;
  name: string;
  is_down: number;
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
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    return { status: res.status, error: null };
  } catch (e) {
    return { status: null, error: e instanceof Error ? e.message : 'fetch failed' };
  } finally {
    clearTimeout(timer);
  }
}

async function notify(
  newlyDown: { name: string; fails: string[] }[],
  newlyRecovered: string[]
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
    for (const name of newlyRecovered) lines.push(`- ${name}`);
  }

  const subjectParts: string[] = [];
  if (newlyDown.length) subjectParts.push(`장애 ${newlyDown.length}건`);
  if (newlyRecovered.length) subjectParts.push(`복구 ${newlyRecovered.length}건`);
  const subject = `[gloomymonitor] ${subjectParts.join(', ')}`;

  await sendMail(to, subject, lines.join('\n'));
}

export async function runCheckCycle(): Promise<void> {
  const [programs] = await pool.query<ProgramRow[]>('SELECT id, name, is_down FROM programs');
  const [urls] = await pool.query<UrlRow[]>('SELECT id, program_id, url FROM program_urls');

  const urlsByProgram = new Map<number, UrlRow[]>();
  for (const u of urls) {
    const list = urlsByProgram.get(u.program_id) ?? [];
    list.push(u);
    urlsByProgram.set(u.program_id, list);
  }

  const newlyDown: { name: string; fails: string[] }[] = [];
  const newlyRecovered: string[] = [];

  for (const program of programs) {
    const programUrls = urlsByProgram.get(program.id) ?? [];
    if (programUrls.length === 0) continue;

    let anyFail = false;
    const failDetails: string[] = [];

    for (const u of programUrls) {
      const { status, error } = await checkUrl(u.url);
      if (status !== 200) {
        anyFail = true;
        failDetails.push(`${u.url} -> ${status ?? 'ERROR'}${error ? ` (${error})` : ''}`);
      }
      await pool.query(
        'UPDATE program_urls SET last_status=?, last_checked_at=NOW(), last_error=? WHERE id=?',
        [status, error, u.id]
      );
    }

    const wasDown = !!program.is_down;
    if (anyFail && !wasDown) {
      newlyDown.push({ name: program.name, fails: failDetails });
    } else if (!anyFail && wasDown) {
      newlyRecovered.push(program.name);
    }

    if (anyFail !== wasDown) {
      await pool.query('UPDATE programs SET is_down=? WHERE id=?', [anyFail ? 1 : 0, program.id]);
    }
  }

  if (newlyDown.length > 0 || newlyRecovered.length > 0) {
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
