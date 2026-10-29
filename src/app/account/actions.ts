'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAuthUser } from '@/lib/supabase';
import { getDb } from '@/lib/db';
import { districts } from '@/lib/regions';
export type FavoriteState = { message: string; success: boolean };
export async function saveFavorite(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getAuthUser();
  if (
    !user?.email ||
    (!user.email_confirmed_at && user.app_metadata?.provider === 'email')
  )
    return {
      message:
        '이메일 인증 계정 또는 이메일이 제공된 카카오 계정으로 로그인해 주세요.',
      success: false,
    };
  const code = z
    .string()
    .regex(/^26\d{3}$/)
    .safeParse(form.get('district'));
  const district = code.success
    ? districts.find((item) => item.code === code.data)
    : undefined;
  if (!district)
    return { message: '부산 구·군을 선택해 주세요.', success: false };
  try {
    const db = getDb();
    await db.$transaction(async (tx) => {
      const profile = await tx.user.upsert({
        where: { supabaseAuthId: user.id },
        create: { supabaseAuthId: user.id, email: user.email! },
        update: {},
      });
      const region = await tx.region.upsert({
        where: { code: district.code },
        create: { code: district.code, name: district.name },
        update: {},
      });
      await tx.favoriteRegion.upsert({
        where: { userId_regionId: { userId: profile.id, regionId: region.id } },
        create: { userId: profile.id, regionId: region.id },
        update: {},
      });
    });
  } catch {
    console.error('favorite_save_failed');
    return {
      message:
        '저장하지 못했습니다. DB 준비 상태나 기존 계정 연결을 확인해 주세요.',
      success: false,
    };
  }
  revalidatePath('/account');
  revalidatePath('/');
  revalidatePath('/favorites');
  return {
    message: district.name + '을(를) 관심지역에 저장했습니다.',
    success: true,
  };
}
export async function removeFavorite(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getAuthUser();
  const id = z.uuid().safeParse(form.get('id'));
  if (!user || !id.success)
    return { message: '로그인 상태와 요청을 확인해 주세요.', success: false };
  try {
    await getDb().favoriteRegion.deleteMany({
      where: { id: id.data, user: { supabaseAuthId: user.id } },
    });
  } catch {
    return { message: '관심지역을 해제하지 못했습니다.', success: false };
  }
  revalidatePath('/account');
  return { message: '관심지역을 해제했습니다.', success: true };
}

export async function updateFavorite(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getAuthUser();
  const id = z.uuid().safeParse(form.get('id'));
  if (!user || !id.success)
    return { success: false, message: '로그인 상태와 요청을 확인해 주세요.' };
  try {
    const result = await getDb().favoriteRegion.updateMany({
      where: { id: id.data, user: { supabaseAuthId: user.id } },
      data: { alertsEnabled: form.get('alerts') === 'on' },
    });
    if (!result.count)
      return { success: false, message: '수정할 관심지역이 없습니다.' };
  } catch {
    return { success: false, message: '설정을 저장하지 못했습니다.' };
  }
  revalidatePath('/account');
  revalidatePath('/favorites');
  revalidatePath('/');
  return { success: true, message: '관심지역 알림 설정을 저장했습니다.' };
}
