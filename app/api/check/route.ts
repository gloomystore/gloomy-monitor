import { NextResponse } from 'next/server';
import { checkNow } from '@/lib/checker';

export async function POST() {
  await checkNow();
  return NextResponse.json({ ok: true });
}
