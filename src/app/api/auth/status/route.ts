import { NextResponse, connection } from 'next/server';
import { getAuthUser } from '@/lib/supabase';
export async function GET() {
  await connection();
  const user = await getAuthUser();
  return NextResponse.json(
    { authenticated: Boolean(user) },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } },
  );
}
