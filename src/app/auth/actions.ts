'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase';
export type AuthState = { message: string; success: boolean };
const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});
export async function authenticate(
  mode: 'login' | 'signup',
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (mode !== 'login' && mode !== 'signup')
    return { message: '잘못된 요청입니다.', success: false };
  const parsed = credentials.safeParse({
    email: String(form.get('email') ?? '').trim(),
    password: form.get('password'),
  });
  if (!parsed.success)
    return {
      message: '이메일 형식과 비밀번호 길이(8~128자)를 확인해 주세요.',
      success: false,
    };
  const client = await createAuthClient();
  if (!client)
    return {
      message: '이메일 인증 서비스 설정이 아직 완료되지 않았습니다.',
      success: false,
    };
  try {
    if (mode === 'signup') {
      const { data, error } = await client.auth.signUp(parsed.data);
      if (error)
        return {
          message:
            '가입 요청을 처리하지 못했습니다. 입력값을 확인하거나 잠시 후 다시 시도해 주세요.',
          success: false,
        };
      if (!data.session)
        return {
          message:
            '가입 요청을 받았습니다. 이메일의 확인 링크로 인증한 후 로그인해 주세요. 기존 계정이라면 로그인을 이용해 주세요.',
          success: true,
        };
    } else {
      const { error } = await client.auth.signInWithPassword(parsed.data);
      if (error)
        return {
          message:
            '로그인하지 못했습니다. 이메일·비밀번호와 이메일 인증 상태를 확인해 주세요.',
          success: false,
        };
    }
  } catch {
    return {
      message: '인증 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      success: false,
    };
  }
  redirect('/account');
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
  redirect(failed ? '/account?notice=logout-failed' : '/login');
}
