'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { LoginLink } from './login-link';
import { safeReturnTo } from '@/lib/auth-navigation';
export function SessionControls() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [message, setMessage] = useState('');
  const success = search.get('auth_success') === '1';
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const response = await fetch('/api/auth/status', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        setAuthenticated(data.authenticated === true);
        if (data.authenticated && success) {
          setMessage('로그인되었습니다.');
          const clean = safeReturnTo(
            window.location.pathname +
              window.location.search +
              window.location.hash,
          );
          router.replace(clean, { scroll: false });
          try {
            const saved = JSON.parse(
              sessionStorage.getItem('jeongbi-auth-resume') ?? 'null',
            );
            if (
              saved &&
              Date.now() - saved.at < 3600000 &&
              saved.path === clean &&
              Number.isFinite(saved.scroll)
            ) {
              setTimeout(
                () =>
                  window.scrollTo({
                    top: Math.max(0, saved.scroll),
                    behavior: 'instant',
                  }),
                400,
              );
            }
            sessionStorage.removeItem('jeongbi-auth-resume');
          } catch {
            /* No personal data is stored here. */
          }
        }
      } catch {
        /* The authenticated server remains authoritative. */
      }
    };
    void check();
    const visible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', visible);
    };
  }, [pathname, success, router]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <>
      {message && (
        <div className="auth-toast" role="status" aria-live="polite">
          {message}
        </div>
      )}
      {authenticated ? (
        <button
          className="icon-button"
          onClick={() => router.push('/my')}
          aria-label="로그인된 사용자 MY"
        >
          <UserRound />
        </button>
      ) : (
        <LoginLink />
      )}
    </>
  );
}
