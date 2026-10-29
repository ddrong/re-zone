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
  const token_hash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  let success = false;
  if (
    token_hash &&
    token_hash.length < 4096 &&
    (type === 'email' || type === 'signup')
  ) {
    const client = await createAuthClient();
    if (client) {
      try {
        const { error } = await client.auth.verifyOtp({ token_hash, type });
        success = !error;
      } catch {
        /* Do not log verification tokens. */
      }
    }
  }
  const response = NextResponse.redirect(
    new URL(
      success
        ? withAuthSuccess(next)
        : '/auth/error?next=' + encodeURIComponent(next),
      PRODUCTION_ORIGIN,
    ),
  );
  response.cookies.delete('jeongbi_auth_return');
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
