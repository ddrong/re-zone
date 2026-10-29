import { NextResponse, type NextRequest } from 'next/server';
import { createAuthClient } from '@/lib/supabase';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const client = await createAuthClient();
  if (code && client) {
    try {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error)
        return NextResponse.redirect(new URL('/account', request.url));
    } catch {
      /* No provider errors in responses. */
    }
  }
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
