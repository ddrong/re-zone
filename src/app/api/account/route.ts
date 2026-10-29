import { connection, NextResponse } from 'next/server';
import { getMember } from '@/lib/member';
import { getDb } from '@/lib/db';
export async function GET() {
  await connection();
  const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
  const user = await getMember();
  const empty = {
    favorites: [],
    favoriteZones: [],
    notices: [],
    preferences: null,
    profileName: null,
    unread: 0,
  };
  if (!user)
    return NextResponse.json(
      { authenticated: false, ready: false, ...empty },
      { headers },
    );
  try {
    const profile = await getDb().user.findUnique({
      where: { supabaseAuthId: user.id },
      select: {
        name: true,
        favoriteRegions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            alertsEnabled: true,
            region: { select: { name: true, code: true } },
          },
        },
        favoriteZones: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            alertsEnabled: true,
            zone: {
              select: {
                name: true,
                externalId: true,
                projectType: true,
                address: true,
              },
            },
          },
        },
        notificationPreference: {
          select: {
            saleEnabled: true,
            auctionEnabled: true,
            priceEnabled: true,
            stageEnabled: true,
            appEnabled: true,
            kakaoRequested: true,
            frequency: true,
            updatedAt: true,
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
        canSave: true,
        profileName: profile?.name ?? null,
        favorites: profile?.favoriteRegions ?? [],
        favoriteZones: profile?.favoriteZones ?? [],
        preferences: profile?.notificationPreference ?? null,
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
        ...empty,
        message:
          '회원 DB가 아직 준비되지 않았거나 연결할 수 없습니다. 승인된 DB 적용 후 다시 확인해 주세요.',
      },
      { headers },
    );
  }
}
