import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';
import { restartChecker } from '@/lib/checker';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT interval_seconds FROM settings WHERE id=1');
  return NextResponse.json({ interval_seconds: rows[0]?.interval_seconds ?? 60 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const seconds = Number(body.interval_seconds);
  if (!Number.isFinite(seconds) || seconds < 5) {
    return NextResponse.json({ error: '최소 5초 이상이어야 합니다.' }, { status: 400 });
  }
  await pool.query('UPDATE settings SET interval_seconds=? WHERE id=1', [Math.floor(seconds)]);
  restartChecker().catch((e) => console.error('[gloomymonitor] restartChecker failed', e));
  return NextResponse.json({ ok: true });
}
