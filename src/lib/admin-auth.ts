import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'megapixel2026';
const SESSION_COOKIE = 'admin-session';

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === ADMIN_PASSWORD;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getPassword() {
  return ADMIN_PASSWORD;
}
