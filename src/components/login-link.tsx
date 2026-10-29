'use client';
import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { safeReturnTo } from '@/lib/auth-navigation';
export function rememberAuthReturn(path: string) {
  try {
    sessionStorage.setItem(
      'jeongbi-auth-resume',
      JSON.stringify({
        path: safeReturnTo(path),
        scroll: window.scrollY,
        at: Date.now(),
      }),
    );
  } catch {
    /* Optional scroll restoration. */
  }
}
type Props = { children?: React.ReactNode; className?: string };
function AuthEntryLink({
  mode,
  children,
  className = 'login-entry',
}: Props & { mode: 'login' | 'signup' }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const next = safeReturnTo(pathname + (query ? '?' + query : ''));
  return (
    <Link
      className={className}
      href={'/' + mode + '?next=' + encodeURIComponent(next)}
      onClick={() => rememberAuthReturn(next)}
    >
      {children}
    </Link>
  );
}
export function LoginLink({
  children = '로그인',
  className = 'login-entry',
}: Props) {
  return (
    <Suspense
      fallback={
        <Link className={className} href="/login?next=%2Fareas">
          {children}
        </Link>
      }
    >
      <AuthEntryLink mode="login" className={className}>
        {children}
      </AuthEntryLink>
    </Suspense>
  );
}
export function SignupLink({
  children = '회원가입',
  className = 'login-entry',
}: Props) {
  return (
    <Suspense
      fallback={
        <Link className={className} href="/signup?next=%2Fareas">
          {children}
        </Link>
      }
    >
      <AuthEntryLink mode="signup" className={className}>
        {children}
      </AuthEntryLink>
    </Suspense>
  );
}
