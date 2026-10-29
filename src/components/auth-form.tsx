'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { authenticate } from '@/app/auth/actions';
export function AuthForm({
  mode,
  configured,
}: {
  mode: 'login' | 'signup';
  configured: boolean;
}) {
  const [state, action, pending] = useActionState(
    authenticate.bind(null, mode),
    { message: '', success: false },
  );
  const signup = mode === 'signup';
  return (
    <form action={action} className="auth-form">
      {!configured && (
        <p className="notice">
          이메일 인증 서비스 준비 중입니다. 정비사업은 로그인 없이 둘러볼 수
          있습니다.
        </p>
      )}
      <label htmlFor="email">이메일</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        placeholder="you@example.com"
        disabled={!configured || pending}
      />
      <label htmlFor="password">비밀번호</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete={signup ? 'new-password' : 'current-password'}
        required
        minLength={8}
        maxLength={128}
        placeholder="8자 이상 입력해 주세요"
        disabled={!configured || pending}
      />
      {signup && (
        <p className="muted small">
          이메일 확인 후 로그인할 수 있습니다. 비밀번호는 정비ON AI 프로필에
          저장하지 않습니다.
        </p>
      )}
      <p
        aria-live="polite"
        role={state.success ? 'status' : 'alert'}
        className={state.success ? 'success' : 'form-error'}
      >
        {state.message}
      </p>
      <button className="button primary full" disabled={!configured || pending}>
        {pending ? '처리 중…' : signup ? '이메일로 가입하기' : '로그인'}
      </button>
      <p className="center small">
        {signup ? '이미 계정이 있나요? ' : '아직 계정이 없나요? '}
        <Link href={signup ? '/login' : '/signup'}>
          {signup ? '로그인' : '회원가입'}
        </Link>
      </p>
    </form>
  );
}
