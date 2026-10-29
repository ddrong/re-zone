import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createAuthClient } from '@/lib/supabase';
import {
  callbackReturnTo,
  withAuthSuccess,
  PRODUCTION_ORIGIN,
} from '@/lib/auth-navigation';
export async function GET(request: NextRequest) {
  const store = await cookies();
  const next = callbackReturnTo(
    request.nextUrl.searchParams.get('next') ??
      store.get('jeongbi_auth_return')?.value,
  );
  const code = request.nextUrl.searchParams.get('code');
  const client = await createAuthClient();
  let success = false;
  if (code && code.length < 4096 && client) {
    try {
      const { error } = await client.auth.exchangeCodeForSession(code);
      success = !error;
    } catch {
      /* No provider errors or tokens in logs. */
    }
  }
  const target = success
    ? withAuthSuccess(next)
    : '/auth/error?next=' + encodeURIComponent(next);
  const response = NextResponse.redirect(new URL(target, PRODUCTION_ORIGIN));
  response.cookies.delete('jeongbi_auth_return');
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
