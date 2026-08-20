import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';
import { restartChecker } from '@/lib/checker';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT interval_seconds, down_threshold_seconds, last_mail_ok, last_mail_error, last_mail_at FROM settings WHERE id=1'
  );
  const row = rows[0];
  return NextResponse.json({
    interval_seconds: row?.interval_seconds ?? 60,
    down_threshold_seconds: row?.down_threshold_seconds ?? 0,
    last_mail_ok: row?.last_mail_ok ?? null,
    last_mail_error: row?.last_mail_error ?? null,
    last_mail_at: row?.last_mail_at ?? null,
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const updates: string[] = [];
  const values: number[] = [];

  if (body.interval_seconds !== undefined) {
    const seconds = Number(body.interval_seconds);
    if (!Number.isFinite(seconds) || seconds < 5) {
      return NextResponse.json({ error: '체크 주기는 최소 5초 이상이어야 합니다.' }, { status: 400 });
    }
    updates.push('interval_seconds=?');
    values.push(Math.floor(seconds));
  }

  if (body.down_threshold_seconds !== undefined) {
    const seconds = Number(body.down_threshold_seconds);
    if (!Number.isFinite(seconds) || seconds < 0) {
      return NextResponse.json(
        { error: '장애 판정 기준 시간은 0 이상이어야 합니다.' },
        { status: 400 }
      );
    }
    updates.push('down_threshold_seconds=?');
    values.push(Math.floor(seconds));
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: '변경할 값이 없습니다.' }, { status: 400 });
  }

  await pool.query(`UPDATE settings SET ${updates.join(', ')} WHERE id=1`, values);
  if (body.interval_seconds !== undefined) {
    restartChecker().catch((e) => console.error('[gloomymonitor] restartChecker failed', e));
  }
  return NextResponse.json({ ok: true });
}
