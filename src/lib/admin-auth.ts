import { cookies } from 'next/headers';
import { createHash } from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'megapixel2026';
const SESSION_COOKIE = 'admin-session';

function hashPassword(pw: string): string {
  return createHash('sha256').update('panconnect-salt-' + pw).digest('hex');
}

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === hashPassword(ADMIN_PASSWORD);
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionToken(): string {
  return hashPassword(ADMIN_PASSWORD);
}

export function getPassword() {
  return ADMIN_PASSWORD || '';
}
