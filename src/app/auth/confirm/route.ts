import { NextResponse, type NextRequest } from 'next/server';
import { createAuthClient } from '@/lib/supabase';
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (token_hash && type === 'email') {
    const client = await createAuthClient();
    if (client) {
      try {
        const { error } = await client.auth.verifyOtp({
          token_hash,
          type: 'email',
        });
        if (!error)
          return NextResponse.redirect(new URL('/account', request.url));
      } catch {
        /* No token details in responses. */
      }
    }
  }
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
