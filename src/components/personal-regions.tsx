'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { KakaoLogin } from './kakao-login';
import {
  FavoriteForm,
  RemoveFavorite,
  FavoriteSettings,
} from './favorite-form';
type Account = {
  authenticated: boolean;
  ready: boolean;
  canSave?: boolean;
  unread?: number;
  message?: string;
  favorites: {
    id: string;
    alertsEnabled: boolean;
    region: { name: string; code: string };
  }[];
  notices: {
    id: string;
    title: string;
    message: string;
    readAt: string | null;
    createdAt: string;
  }[];
};
export function PersonalRegions({
  variant = 'home',
}: {
  variant?: 'home' | 'favorites' | 'alerts';
}) {
  const pathname = usePathname();
  const [state, setState] = useState<Account | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let generation = 0;
    const load = async () => {
      const version = ++generation;
      try {
        const response = await fetch('/api/account', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('ACCOUNT_UNAVAILABLE');
        const data = await response.json();
        if (controller.signal.aborted || version !== generation) return;
        setState(data);
        setFailed(false);
      } catch {
        if (!controller.signal.aborted && version === generation) {
          setState(null);
          setFailed(true);
        }
      }
    };
    const refresh = () => {
      setState(null);
      void load();
    };
    void load();
    window.addEventListener('jeongbi-account-changed', refresh);
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      controller.abort();
      window.removeEventListener('jeongbi-account-changed', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [pathname, revision]);
  const title =
    variant === 'alerts'
      ? '내 관심지역 새 소식'
      : variant === 'favorites'
        ? '내 관심지역 관리'
        : '관심지역 새 소식';
  return (
    <section className="section personal-regions">
      <div className="section-heading">
        <h2>{title}</h2>
        <Link href="/account">관리하기 →</Link>
      </div>
      {failed ? (
        <div role="alert">
          계정 정보를 불러오지 못했습니다.{' '}
          <button onClick={() => setRevision((n) => n + 1)}>다시 시도</button>
        </div>
      ) : !state ? (
        <p role="status">계정 상태 확인 중…</p>
      ) : !state.authenticated ? (
        <div className="personal-empty">
          <p>로그인하고 내 관심지역 소식을 모아보세요.</p>
          <KakaoLogin label="카카오톡 로그인하기" />
        </div>
      ) : !state.ready ? (
        <div role="alert">
          <p>{state.message}</p>
          <button
            className="button-secondary"
            onClick={() => setRevision((n) => n + 1)}
          >
            다시 조회
          </button>
        </div>
      ) : (
        <>
          <div className="interest-chips">
            {state.favorites.map((f) => (
              <Link
                className="interest-chip"
                key={f.id}
                href={'/areas?district=' + f.region.code}
              >
                {f.region.name}
              </Link>
            ))}
          </div>
          {!state.favorites.length && (
            <div className="personal-empty">
              <p>아직 저장한 관심지역이 없습니다.</p>
              <Link className="button-primary" href="/account">
                관심지역 등록하기
              </Link>
            </div>
          )}
          {variant === 'favorites' && (
            <>
              <FavoriteForm selected="26230" ready={state.canSave !== false} />
              {state.favorites.map((f) => (
                <article className="panel personal-edit" key={f.id}>
                  <strong>{f.region.name}</strong>
                  <FavoriteSettings id={f.id} enabled={f.alertsEnabled} />
                  <RemoveFavorite id={f.id} />
                </article>
              ))}
            </>
          )}
          {state.canSave === false && (
            <p className="notice">
              카카오 로그인은 유지됩니다. 현재 프로필 모델은 이메일이 필수이므로
              이메일 미제공 계정의 관심지역 저장은 지원하지 않습니다. 임의
              이메일은 생성하지 않습니다.
            </p>
          )}
          <div className="personal-notices">
            {state.notices.length ? (
              state.notices.map((n) => (
                <article className="alert-row" key={n.id}>
                  <div>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <small>
                      {new Date(n.createdAt).toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                      })}
                    </small>
                  </div>
                </article>
              ))
            ) : (
              <p>저장된 새 소식이 없습니다.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
