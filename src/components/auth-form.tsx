'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { authenticate } from '@/app/auth/actions';
import { safeReturnTo } from '@/lib/auth-navigation';
export function AuthForm({
  mode,
  configured,
  next = '/areas',
}: {
  mode: 'login' | 'signup';
  configured: boolean;
  next?: string;
}) {
  const [state, action, pending] = useActionState(
    authenticate.bind(null, mode),
    { message: '', success: false },
  );
  const signup = mode === 'signup';
  const target = safeReturnTo(next);
  return (
    <form action={action} className="auth-form">
      {!configured && (
        <p className="notice">
          이메일 인증 서비스 준비 중입니다. 정비사업은 로그인 없이 둘러볼 수
          있습니다.
        </p>
      )}
      <input type="hidden" name="next" value={target} />
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
        minLength={signup ? 8 : 1}
        maxLength={128}
        placeholder={
          signup ? '8자 이상 입력해 주세요' : '비밀번호를 입력해 주세요'
        }
        disabled={!configured || pending}
      />
      {signup && (
        <p className="muted small">
          새 인증 메일을 확인해 주세요. 인증 후 원래 페이지로 돌아옵니다.
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
        <Link
          href={
            (signup ? '/login' : '/signup') +
            '?next=' +
            encodeURIComponent(target)
          }
        >
          {signup ? '로그인' : '회원가입'}
        </Link>
      </p>
      <Link className="auth-back-link" href={target}>
        보고 있던 페이지로 돌아가기
      </Link>
    </form>
  );
}
