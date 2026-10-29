'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { LoginLink } from './login-link';
import { safeReturnTo } from '@/lib/auth-navigation';
export function SessionControls() {
  const pathname = usePathname(),
    search = useSearchParams(),
    router = useRouter();
  const [authenticated, setAuthenticated] = useState(false),
    [message, setMessage] = useState('');
  const success = search.get('auth_success') === '1',
    signedOut = search.get('signed_out') === '1',
    localOnly = search.get('notice') === 'logout-local-only';
  useEffect(() => {
    const controller = new AbortController();
    let generation = 0;
    const publish = (value: boolean) =>
      window.dispatchEvent(
        new CustomEvent('jeongbi-auth-state', {
          detail: { authenticated: value },
        }),
      );
    const check = async () => {
      const version = ++generation;
      try {
        const response = await fetch('/api/auth/status', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('AUTH_STATUS_UNAVAILABLE');
        const data = await response.json();
        if (controller.signal.aborted || version !== generation) return;
        const valid = data.authenticated === true;
        setAuthenticated(valid);
        publish(valid);
        if (valid && success) {
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
            )
              setTimeout(
                () =>
                  window.scrollTo({
                    top: Math.max(0, saved.scroll),
                    behavior: 'instant',
                  }),
                400,
              );
            sessionStorage.removeItem('jeongbi-auth-resume');
          } catch {
            /* Only navigation state is stored here. */
          }
        } else if (!valid && signedOut && localOnly)
          setMessage(
            '이 브라우저에서 로그아웃했습니다. 서버 세션 종료는 확인하지 못했습니다.',
          );
      } catch {
        if (!controller.signal.aborted && version === generation) {
          setAuthenticated(false);
          publish(false);
        }
      }
    };
    void check();
    const visible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    const restored = (event: PageTransitionEvent) => {
      setAuthenticated(false);
      publish(false);
      void check();
      if (event.persisted) router.refresh();
    };
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('pageshow', restored);
    return () => {
      controller.abort();
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('pageshow', restored);
    };
  }, [pathname, success, signedOut, localOnly, router]);
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
