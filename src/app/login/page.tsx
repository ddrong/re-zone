import { Suspense } from 'react';
import { connection } from 'next/server';
import { AuthForm } from '@/components/auth-form';
import { authConfigured } from '@/lib/supabase';
import { safeReturnTo } from '@/lib/auth-navigation';
export const metadata = { title: '로그인' };
type Params = Promise<{ next?: string }>;
export default function Login({ searchParams }: { searchParams: Params }) {
  return (
    <section className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>다시 만나 반가워요.</h1>
        <p className="muted">로그인 후 보고 있던 페이지로 돌아갑니다.</p>
        <Suspense fallback={<p>로그인 준비 중…</p>}>
          <Form searchParams={searchParams} />
        </Suspense>
      </section>
    </section>
  );
}
async function Form({ searchParams }: { searchParams: Params }) {
  await connection();
  const p = await searchParams;
  return (
    <AuthForm
      mode="login"
      configured={authConfigured()}
      next={safeReturnTo(p.next)}
    />
  );
}
