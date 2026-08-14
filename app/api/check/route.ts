import { NextResponse } from 'next/server';
import { runCheckCycle } from '@/lib/checker';

export async function POST() {
  await runCheckCycle();
  return NextResponse.json({ ok: true });
}
