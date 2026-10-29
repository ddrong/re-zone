import { NextResponse, connection } from 'next/server';
import { getAuthUser } from '@/lib/supabase';
import { AUTH_NO_CACHE } from '@/lib/auth-cookies';
export async function GET() {
  await connection();
  const user = await getAuthUser();
  return NextResponse.json(
    { authenticated: Boolean(user) },
    { headers: { ...AUTH_NO_CACHE, Vary: 'Cookie' } },
  );
}
