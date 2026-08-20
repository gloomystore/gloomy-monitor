import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, program_name, type, detail, occurred_at FROM incidents ORDER BY occurred_at DESC LIMIT 500'
  );
  return NextResponse.json(rows);
}
