import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  authCookieOptions,
  duplicateSessionNames,
  LOGOUT_COOKIE,
} from './auth-cookies';
export function authConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
export async function createAuthClient({
  writable = true,
}: { writable?: boolean } = {}) {
  if (!authConfigured()) return null;
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookieOptions: authCookieOptions(),
      cookies: {
        getAll: () => store.getAll(),
        setAll(items) {
          // Read-only Server Components rely on proxy.ts for refresh. Mutations must never swallow a write failure.
          if (!writable) return;
          try {
            items.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          } catch {
            throw new Error('AUTH_COOKIE_WRITE_FAILED');
          }
        },
      },
    },
  );
}
export async function getAuthUser({
  writable = false,
}: { writable?: boolean } = {}) {
  const store = await cookies();
  if (
    store.get(LOGOUT_COOKIE)?.value === '1' ||
    duplicateSessionNames(store.getAll())
  )
    return null;
  const client = await createAuthClient({ writable });
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser();
    return error ? null : data.user;
  } catch {
    return null;
  }
}
