'use server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase';
import {
  safeReturnTo,
  withAuthSuccess,
  authErrorMessage,
  PRODUCTION_ORIGIN,
} from '@/lib/auth-navigation';
export type AuthState = { message: string; success: boolean };
export async function authenticate(
  mode: 'login' | 'signup',
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (mode !== 'login' && mode !== 'signup')
    return { message: '잘못된 요청입니다.', success: false };
  const schema = z.object({
    email: z.email().max(254),
    password: z
      .string()
      .min(mode === 'signup' ? 8 : 1)
      .max(128),
  });
  const parsed = schema.safeParse({
    email: String(form.get('email') ?? '').trim(),
    password: form.get('password'),
  });
  if (!parsed.success)
    return {
      message:
        mode === 'signup'
          ? '이메일과 8~128자 비밀번호를 확인해 주세요.'
          : '이메일과 비밀번호를 입력해 주세요.',
      success: false,
    };
  const next = safeReturnTo(form.get('next'));
  const client = await createAuthClient();
  if (!client)
    return {
      message: '이메일 인증 서비스 설정이 아직 완료되지 않았습니다.',
      success: false,
    };
  const store = await cookies();
  store.set('jeongbi_auth_return', next, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });
  try {
    if (mode === 'signup') {
      const { data, error } = await client.auth.signUp({
        ...parsed.data,
        options: {
          emailRedirectTo:
            PRODUCTION_ORIGIN +
            '/auth/callback?next=' +
            encodeURIComponent(next),
        },
      });
      if (error)
        return { message: authErrorMessage(error.code), success: false };
      if (!data.session)
        return {
          message:
            '가입 요청을 받았습니다. 새 인증 메일의 링크를 확인한 뒤 로그인해 주세요. 기존 계정이라면 로그인을 이용해 주세요.',
          success: true,
        };
    } else {
      const { error } = await client.auth.signInWithPassword(parsed.data);
      if (error)
        return { message: authErrorMessage(error.code), success: false };
    }
  } catch {
    return {
      message: '인증 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      success: false,
    };
  }
  store.delete('jeongbi_auth_return');
  redirect(withAuthSuccess(next));
}
export async function signOut() {
  const client = await createAuthClient();
  let failed = false;
  if (client) {
    try {
      const { error } = await client.auth.signOut();
      failed = Boolean(error);
    } catch {
      failed = true;
    }
  }
  if (failed) redirect('/my?notice=logout-failed');
  const store = await cookies();
  store.delete('jeongbi_auth_return');
  redirect('/?signed_out=1');
}
