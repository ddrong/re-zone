import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  AUTH_NO_CACHE,
  authCookieOptions,
  isProjectAuthCookie,
  LOGOUT_COOKIE,
} from '@/lib/auth-cookies';
function privateResponse(response: NextResponse) {
  Object.entries(AUTH_NO_CACHE).forEach(([key, value]) =>
    response.headers.set(key, value),
  );
  return response;
}
export async function proxy(request: NextRequest) {
  let response = privateResponse(NextResponse.next({ request }));
  // Actions handle their own writable auth operation; never refresh before a logout POST.
  if (request.method !== 'GET') return response;
  if (request.cookies.get(LOGOUT_COOKIE)?.value === '1') {
    for (const { name } of request.cookies.getAll())
      if (isProjectAuthCookie(name, false))
        response.cookies.set(name, '', {
          ...authCookieOptions(),
          maxAge: 0,
          expires: new Date(0),
        });
    return response;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const writes = new Map<
    string,
    { name: string; value: string; options: CookieOptions }
  >();
  const client = createServerClient(url, key, {
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items, headers) {
        items.forEach((item) => {
          request.cookies.set(item.name, item.value);
          writes.set(item.name, item);
        });
        response = privateResponse(NextResponse.next({ request }));
        writes.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });
  try {
    await client.auth.getUser();
  } catch {
    /* Protected handlers verify identity again. */
  }
  return response;
}
export const config = {
  matcher: [
    '/account/:path*',
    '/my',
    '/login',
    '/signup',
    '/api/account',
    '/api/auth/status',
  ],
};
