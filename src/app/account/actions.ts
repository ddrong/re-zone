'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { getMember, ensureProfile, accountFailure } from '@/lib/member';
import { districts } from '@/lib/regions';
import { getOfficialZone } from '@/lib/public-zones';
export type FavoriteState = {
  message: string;
  success: boolean;
  code?: string;
};
const unauthorized = () => ({
  message: '로그인 후 이용해 주세요.',
  success: false,
  code: 'AUTH_REQUIRED',
});
function refreshAccount() {
  for (const path of ['/', '/account', '/favorites', '/alerts', '/my'])
    revalidatePath(path);
}
export async function saveFavorite(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getMember({ writable: true });
  if (!user) return unauthorized();
  const district = districts.find((d) => d.code === form.get('district'));
  if (!district)
    return { success: false, message: '부산 구·군을 선택해 주세요.' };
  try {
    await getDb().$transaction(async (tx) => {
      const profile = await ensureProfile(tx, user);
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
  } catch (error) {
    return accountFailure(error);
  }
  refreshAccount();
  return {
    success: true,
    message: district.name + '을(를) 관심지역에 저장했습니다.',
  };
}
export async function removeFavorite(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getMember({ writable: true });
  if (!user) return unauthorized();
  const id = z.uuid().safeParse(form.get('id'));
  if (!id.success) return { success: false, message: '요청을 확인해 주세요.' };
  try {
    const result = await getDb().favoriteRegion.deleteMany({
      where: { id: id.data, user: { supabaseAuthId: user.id } },
    });
    if (!result.count)
      return { success: false, message: '해제할 관심지역이 없습니다.' };
  } catch (error) {
    return accountFailure(error);
  }
  refreshAccount();
  return { success: true, message: '관심지역을 해제했습니다.' };
}
export async function updateFavorite(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getMember({ writable: true });
  if (!user) return unauthorized();
  const id = z.uuid().safeParse(form.get('id'));
  const alerts = form.get('alerts');
  if (!id.success || (alerts !== null && alerts !== 'on'))
    return { success: false, message: '설정값을 확인해 주세요.' };
  try {
    const result = await getDb().favoriteRegion.updateMany({
      where: { id: id.data, user: { supabaseAuthId: user.id } },
      data: { alertsEnabled: form.get('alerts') === 'on' },
    });
    if (!result.count)
      return { success: false, message: '수정할 관심지역이 없습니다.' };
  } catch (error) {
    return accountFailure(error);
  }
  refreshAccount();
  return { success: true, message: '관심지역 알림 설정을 저장했습니다.' };
}
export async function saveOfficialZone(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getMember({ writable: true });
  if (!user) return unauthorized();
  const id = z
    .string()
    .regex(/^BARA_\d{13}$/)
    .safeParse(form.get('externalId'));
  if (!id.success)
    return { success: false, message: '공식 정비구역을 선택해 주세요.' };
  let zone;
  try {
    zone = await getOfficialZone(id.data);
  } catch {
    return {
      success: false,
      message:
        '부산시 원문을 확인하지 못해 저장하지 않았습니다. 다시 시도해 주세요.',
    };
  }
  const district = districts.find((d) => d.name === zone?.district);
  if (
    !zone ||
    zone.demo ||
    !district ||
    !['재개발', '재건축'].includes(zone.type)
  )
    return {
      success: false,
      message: '공식 사업유형과 구·군을 확인할 수 없어 저장하지 않았습니다.',
    };
  const official = zone;
  try {
    await getDb().$transaction(async (tx) => {
      const profile = await ensureProfile(tx, user);
      const region = await tx.region.upsert({
        where: { code: district.code },
        create: { code: district.code, name: district.name },
        update: {},
      });
      const source = await tx.dataSource.upsert({
        where: { code: 'BUSAN_DYNAMICE' },
        create: {
          code: 'BUSAN_DYNAMICE',
          name: '부산 정비사업 공개자료',
          provider: '부산광역시',
          referenceUrl: 'https://dynamice.busan.go.kr/view.do?no=273',
        },
        update: {},
      });
      const facts = {
        name: official.name,
        projectType:
          official.type === '재개발'
            ? ('REDEVELOPMENT' as const)
            : ('RECONSTRUCTION' as const),
        regionId: region.id,
        address: official.address || null,
        lastSeenAt: new Date(),
      };
      const record = await tx.redevelopmentZone.upsert({
        where: {
          sourceId_externalId: { sourceId: source.id, externalId: official.id },
        },
        create: { ...facts, sourceId: source.id, externalId: official.id },
        update: facts,
      });
      await tx.favoriteZone.upsert({
        where: { userId_zoneId: { userId: profile.id, zoneId: record.id } },
        create: { userId: profile.id, zoneId: record.id },
        update: {},
      });
    });
  } catch (error) {
    return accountFailure(error);
  }
  refreshAccount();
  revalidatePath('/zones/' + id.data);
  return {
    success: true,
    message: '공식 정비구역을 내 관심구역에 저장했습니다.',
  };
}
export async function removeOfficialZone(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getMember({ writable: true });
  if (!user) return unauthorized();
  const id = z.uuid().safeParse(form.get('id'));
  if (!id.success) return { success: false, message: '요청을 확인해 주세요.' };
  try {
    const result = await getDb().favoriteZone.deleteMany({
      where: { id: id.data, user: { supabaseAuthId: user.id } },
    });
    if (!result.count)
      return { success: false, message: '해제할 관심구역이 없습니다.' };
  } catch (error) {
    return accountFailure(error);
  }
  refreshAccount();
  return { success: true, message: '내 관심구역에서 해제했습니다.' };
}
export async function updateOfficialZone(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getMember({ writable: true });
  if (!user) return unauthorized();
  const id = z.uuid().safeParse(form.get('id'));
  const alerts = form.get('alerts');
  if (!id.success || (alerts !== null && alerts !== 'on'))
    return { success: false, message: '설정값을 확인해 주세요.' };
  try {
    const result = await getDb().favoriteZone.updateMany({
      where: { id: id.data, user: { supabaseAuthId: user.id } },
      data: { alertsEnabled: alerts === 'on' },
    });
    if (!result.count)
      return { success: false, message: '수정할 관심구역이 없습니다.' };
  } catch (error) {
    return accountFailure(error);
  }
  refreshAccount();
  return { success: true, message: '관심구역 알림 설정을 저장했습니다.' };
}
export async function saveProfile(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getMember({ writable: true });
  if (!user) return unauthorized();
  const name = z.string().trim().max(100).safeParse(form.get('name'));
  if (!name.success)
    return { success: false, message: '이름은 100자 이내로 입력해 주세요.' };
  try {
    await getDb().$transaction(async (tx) => {
      const profile = await ensureProfile(tx, user);
      await tx.user.updateMany({
        where: { id: profile.id, supabaseAuthId: user.id },
        data: { name: name.data || null },
      });
    });
  } catch (error) {
    return accountFailure(error);
  }
  refreshAccount();
  return { success: true, message: '프로필을 저장했습니다.' };
}
export async function saveNotificationPreference(
  _state: FavoriteState,
  form: FormData,
): Promise<FavoriteState> {
  const user = await getMember({ writable: true });
  if (!user) return unauthorized();
  const frequency = z
    .enum(['instant', 'daily', 'weekly'])
    .safeParse(form.get('frequency'));
  const keys = [
    'saleEnabled',
    'auctionEnabled',
    'priceEnabled',
    'stageEnabled',
    'appEnabled',
    'kakaoRequested',
  ] as const;
  if (
    !frequency.success ||
    keys.some((k) => form.get(k) !== null && form.get(k) !== 'on')
  )
    return { success: false, message: '알림 설정값을 확인해 주세요.' };
  const flags = {
    saleEnabled: form.get('saleEnabled') === 'on',
    auctionEnabled: form.get('auctionEnabled') === 'on',
    priceEnabled: form.get('priceEnabled') === 'on',
    stageEnabled: form.get('stageEnabled') === 'on',
    appEnabled: form.get('appEnabled') === 'on',
    kakaoRequested: form.get('kakaoRequested') === 'on',
    frequency: frequency.data,
  };
  try {
    await getDb().$transaction(async (tx) => {
      const profile = await ensureProfile(tx, user);
      await tx.notificationPreference.upsert({
        where: { userId: profile.id },
        create: { userId: profile.id, ...flags },
        update: flags,
      });
    });
  } catch (error) {
    return accountFailure(error);
  }
  refreshAccount();
  return {
    success: true,
    message:
      '알림 수신 희망 설정을 저장했습니다. 외부 메시지는 발송하지 않습니다.',
  };
}
