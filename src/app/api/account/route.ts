import { connection, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase';
import { getDb } from '@/lib/db';
export async function GET() {
  await connection();
  const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json(
      { authenticated: false, ready: false, favorites: [], notices: [] },
      { headers },
    );
  try {
    const profile = await getDb().user.findUnique({
      where: { supabaseAuthId: user.id },
      select: {
        favoriteRegions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            alertsEnabled: true,
            region: { select: { name: true, code: true } },
          },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            title: true,
            message: true,
            readAt: true,
            createdAt: true,
          },
        },
        _count: { select: { notifications: { where: { readAt: null } } } },
      },
    });
    return NextResponse.json(
      {
        authenticated: true,
        ready: true,
        canSave: Boolean(user.email),
        favorites: profile?.favoriteRegions ?? [],
        notices: profile?.notifications ?? [],
        unread: profile?._count.notifications ?? 0,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        authenticated: true,
        ready: false,
        favorites: [],
        notices: [],
        unread: 0,
        message:
          '관심지역 DB에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      },
      { headers },
    );
  }
}
