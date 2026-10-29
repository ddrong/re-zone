import 'server-only';
import { getDb } from './db';
export async function getAccount(authId: string) {
  try {
    const user = await getDb().user.findUnique({
      where: { supabaseAuthId: authId },
      select: {
        id: true,
        name: true,
        favoriteRegions: {
          include: { region: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return { ready: true, user };
  } catch {
    console.error('account_read_failed');
    return { ready: false, user: null };
  }
}
