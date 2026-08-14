import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/session';

export async function POST(req: Request) {
  const user = process.env.AUTH_USER;
  const pass = process.env.AUTH_PASSWORD;

  if (!user || !pass) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json();
  const username = String(body.username ?? '');
  const password = String(body.password ?? '');

  if (username !== user || password !== pass) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const token = await createSessionToken(user, pass);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
