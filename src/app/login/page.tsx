import { Suspense } from 'react';
import { connection } from 'next/server';
import { AuthForm } from '@/components/auth-form';
import { authConfigured } from '@/lib/supabase';
export const metadata = { title: '로그인' };
export default function Login() {
  return (
    <section id="main" className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>다시 만나 반가워요.</h1>
        <p className="muted">나만의 부산 관심지역을 이어서 살펴보세요.</p>
        <Suspense fallback={<p>로그인 준비 중…</p>}>
          <Form />
        </Suspense>
      </section>
    </section>
  );
}
async function Form() {
  await connection();
  return <AuthForm mode="login" configured={authConfigured()} />;
}
