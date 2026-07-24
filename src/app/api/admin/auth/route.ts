import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName, getPassword } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== getPassword()) {
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(getSessionCookieName(), password, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return res;
}
