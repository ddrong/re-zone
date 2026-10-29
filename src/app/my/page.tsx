import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { getAuthUser } from '@/lib/supabase';
import { signOut } from '@/app/auth/actions';
export const metadata = { title: 'MY' };
export default function My() {
  return (
    <Suspense fallback={<p>계정 상태 확인 중…</p>}>
      <AccountConnection />
    </Suspense>
  );
}
async function AccountConnection() {
  await connection();
  const user = await getAuthUser();
  return (
    <div className="account-connection">
      {user ? (
        <>
          <strong>이메일 연결됨</strong>
          <p>{user.email}</p>
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
          <Link className="button-primary" href="/login">
            이메일 로그인
          </Link>
          <Link className="button-secondary" href="/signup">
            회원가입
          </Link>
        </>
      )}
    </div>
  );
}
