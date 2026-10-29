import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { getMember } from '@/lib/member';
import { signOut } from '@/app/auth/actions';
import { LoginLink, SignupLink } from '@/components/login-link';
export const metadata = { title: 'MY' };
type Params = Promise<{ notice?: string }>;
export default function My({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<p>계정 상태 확인 중…</p>}>
      <AccountConnection searchParams={searchParams} />
    </Suspense>
  );
}
async function AccountConnection({ searchParams }: { searchParams: Params }) {
  await connection();
  const user = await getMember();
  const params = await searchParams;
  return (
    <div className="account-connection">
      {params.notice === 'logout-failed' && (
        <p role="alert" className="notice">
          로그아웃하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.
        </p>
      )}
      {user ? (
        <>
          <strong>
            {user.app_metadata?.provider === 'kakao'
              ? '카카오 로그인됨'
              : '이메일 연결됨'}
          </strong>
          <p>{user.email || '이메일 미제공 카카오 계정'}</p>
          <Link className="button-primary" href="/account">
            회원별 관심지역 관리
          </Link>
          <form action={signOut}>
            <button className="button-secondary">로그아웃</button>
          </form>
        </>
      ) : (
        <>
          <p>이메일 계정으로 로그인하고 관심지역을 저장하세요.</p>
          <LoginLink className="button-primary">이메일 로그인</LoginLink>
          <SignupLink className="button-secondary" />
        </>
      )}
    </div>
  );
}
