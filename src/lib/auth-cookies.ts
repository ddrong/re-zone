import type { CookieOptions } from '@supabase/ssr';
export const LOGOUT_COOKIE = 'jeongbi_signed_out';
export const AUTH_NO_CACHE = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  Expires: '0',
  Pragma: 'no-cache',
};
export function authCookieOptions(): CookieOptions {
  return {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
}
export function authStorageKey(url = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    return url
      ? 'sb-' + new URL(url).hostname.split('.')[0] + '-auth-token'
      : null;
  } catch {
    return null;
  }
}
export function isProjectAuthCookie(name: string, includePkce = true) {
  const key = authStorageKey();
  if (!key) return false;
  return (
    name === key ||
    (name.startsWith(key + '.') && /^\d+$/.test(name.slice(key.length + 1))) ||
    (includePkce && name.startsWith(key + '-'))
  );
}
export function duplicateSessionNames(
  items: { name: string; value: string }[],
) {
  const seen = new Set<string>();
  return items.some((item) => {
    if (!isProjectAuthCookie(item.name, false)) return false;
    if (seen.has(item.name)) return true;
    seen.add(item.name);
    return false;
  });
}
type CookieWriter = {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options?: CookieOptions) => unknown;
};
export function clearProjectAuthCookies(store: CookieWriter) {
  for (const { name } of store.getAll())
    if (isProjectAuthCookie(name))
      store.set(name, '', {
        ...authCookieOptions(),
        maxAge: 0,
        expires: new Date(0),
      });
}
export function setLoggedOut(store: CookieWriter) {
  // A late refresh cannot restore app access. Only successful authentication removes this host-only guard.
  store.set(LOGOUT_COOKIE, '1', {
    ...authCookieOptions(),
    httpOnly: true,
    maxAge: 400 * 24 * 60 * 60,
  });
}
