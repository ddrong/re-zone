'use client';
import { Suspense, useActionState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { startKakao } from '@/app/auth/actions';
import { safeReturnTo } from '@/lib/auth-navigation';
export function KakaoLogin({
  label = '카카오로 로그인',
  next,
  dual = false,
}: {
  label?: string;
  next?: string;
  dual?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <button className="kakao-login" disabled>
          카카오 로그인 준비 중…
        </button>
      }
    >
      <KakaoEntry label={label} next={next} dual={dual} />
    </Suspense>
  );
}
function KakaoEntry({
  label,
  next,
  dual,
}: {
  label: string;
  next?: string;
  dual: boolean;
}) {
  const pathname = usePathname();
  const query = useSearchParams();
  const target = safeReturnTo(
    next ?? pathname + (query.size ? '?' + query : ''),
    '/',
  );
  const [state, action, pending] = useActionState(startKakao, {
    message: '',
    success: false,
  });
  return (
    <form action={action} className="kakao-entry">
      <input type="hidden" name="next" value={target} />
      {dual && (
        <button type="submit" className="kakao-login" disabled={pending}>
          {pending ? '카카오로 이동 중…' : '카카오로 3초 회원가입'}
        </button>
      )}
      <button type="submit" className="kakao-login" disabled={pending}>
        {pending ? '카카오로 이동 중…' : label}
      </button>
      {state.message && (
        <p role="alert" className="form-error">
          {state.message}
        </p>
      )}
    </form>
  );
}
