import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

export async function GET() {
  const [programs] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, is_down, updated_at FROM programs ORDER BY id ASC'
  );
  const [urls] = await pool.query<RowDataPacket[]>(
    'SELECT id, program_id, url, last_status, last_checked_at, last_error FROM program_urls ORDER BY id ASC'
  );

  const result = programs.map((p) => ({
    ...p,
    urls: urls.filter((u) => u.program_id === p.id),
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = (body.name ?? '').trim();
  const urls: string[] = Array.isArray(body.urls)
    ? body.urls.map((u: string) => u.trim()).filter(Boolean)
    : [];

  if (!name || urls.length === 0) {
    return NextResponse.json({ error: 'name과 최소 1개의 url이 필요합니다.' }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>('INSERT INTO programs (name) VALUES (?)', [name]);
  const programId = result.insertId;

  for (const url of urls) {
    await pool.query('INSERT INTO program_urls (program_id, url) VALUES (?, ?)', [programId, url]);
  }

  return NextResponse.json({ id: programId }, { status: 201 });
}
