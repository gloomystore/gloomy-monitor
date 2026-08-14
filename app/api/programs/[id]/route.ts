import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  await pool.query('DELETE FROM programs WHERE id=?', [id]);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  const body = await req.json();
  const name = (body.name ?? '').trim();
  const urls: string[] = Array.isArray(body.urls)
    ? body.urls.map((u: string) => u.trim()).filter(Boolean)
    : [];

  if (!name || urls.length === 0) {
    return NextResponse.json({ error: 'name과 최소 1개의 url이 필요합니다.' }, { status: 400 });
  }

  await pool.query('UPDATE programs SET name=?, is_down=0 WHERE id=?', [name, id]);
  await pool.query('DELETE FROM program_urls WHERE program_id=?', [id]);
  for (const url of urls) {
    await pool.query('INSERT INTO program_urls (program_id, url) VALUES (?, ?)', [id, url]);
  }

  return NextResponse.json({ ok: true });
}
