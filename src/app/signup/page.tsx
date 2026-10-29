import { Suspense } from 'react';
import { connection } from 'next/server';
import { AuthForm } from '@/components/auth-form';
import { authConfigured } from '@/lib/supabase';
export const metadata = { title: '회원가입' };
export default function Signup() {
  return (
    <section id="main" className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">START YOUR JOURNEY</p>
        <h1>부산의 변화를 함께.</h1>
        <p className="muted">이메일로 가입하고 관심지역을 저장하세요.</p>
        <Suspense fallback={<p>회원가입 준비 중…</p>}>
          <Form />
        </Suspense>
      </section>
    </section>
  );
}
async function Form() {
  await connection();
  return <AuthForm mode="signup" configured={authConfigured()} />;
}
