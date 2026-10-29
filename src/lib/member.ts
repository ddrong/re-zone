import 'server-only';
import type { User } from '@supabase/supabase-js';
import type { Prisma } from '@/generated_prisma/client';
import { getAuthUser } from './supabase';
export async function getMember(options: { writable?: boolean } = {}) {
  const user = await getAuthUser(options);
  if (
    !user ||
    user.is_anonymous ||
    (user.app_metadata?.provider === 'email' && !user.email_confirmed_at)
  )
    return null;
  return user;
}
// Use only an Auth user returned by getMember, never a client-provided identity.
export async function ensureProfile(tx: Prisma.TransactionClient, user: User) {
  return tx.user.upsert({
    where: { supabaseAuthId: user.id },
    create: { supabaseAuthId: user.id, email: user.email || null },
    update: {},
  });
}
export function accountFailure(error: unknown) {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? error.code
      : undefined;
  if (code === 'P2021' || code === 'P2022')
    return {
      success: false,
      message:
        'DB 모델이 아직 적용되지 않았습니다. 승인된 마이그레이션 적용 후 다시 시도해 주세요.',
      code: 'DB_NOT_READY',
    };
  if (code === 'P2002')
    return {
      success: false,
      message:
        '기존 프로필 연결을 확인해야 합니다. 이메일로 다른 계정을 자동 연결하지 않습니다.',
      code: 'PROFILE_CONFLICT',
    };
  return {
    success: false,
    message: '저장 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    code: 'DB_UNAVAILABLE',
  };
}
