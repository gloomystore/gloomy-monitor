import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

export async function GET() {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, email FROM recipients ORDER BY id ASC');
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = (body.email ?? '').trim();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }
  await pool.query('INSERT IGNORE INTO recipients (email) VALUES (?)', [email]);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  await pool.query('DELETE FROM recipients WHERE id=?', [id]);
  return NextResponse.json({ ok: true });
}
