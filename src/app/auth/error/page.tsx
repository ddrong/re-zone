import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { safeReturnTo } from '@/lib/auth-navigation';
export default function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  return (
    <Suspense fallback={<p>인증 상태 확인 중…</p>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
async function Content({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const next = safeReturnTo(params.next);
  const cancelled = params.reason === 'cancelled';
  return (
    <section className="empty-state">
      <h1>
        {cancelled
          ? '카카오 로그인을 취소했습니다.'
          : '인증을 완료하지 못했습니다.'}
      </h1>
      {cancelled && (
        <p>
          언제든 다시 로그인할 수 있습니다. 공개자료는 로그인 없이 열람할 수
          있습니다.
        </p>
      )}
      <p>
        링크가 만료·사용되었거나 다른 브라우저에서 열려 세션을 연결하지 못했을
        수 있습니다. 새 메일을 확인하거나 로그인해 주세요.
      </p>
      <Link
        className="button primary"
        href={'/login?next=' + encodeURIComponent(next)}
      >
        로그인으로 돌아가기
      </Link>
      <Link className="auth-back-link" href={next}>
        보고 있던 페이지로 돌아가기
      </Link>
    </section>
  );
}
