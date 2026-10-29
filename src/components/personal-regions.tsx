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
import {
  ProfileForm,
  NotificationPreferenceForm,
  SaveOfficialZone,
  RemoveOfficialZone,
  OfficialZoneSettings,
  type Preference,
} from './account-forms';
type FavoriteZone = {
  id: string;
  alertsEnabled: boolean;
  zone: {
    name: string;
    externalId: string;
    projectType: string;
    address: string | null;
  };
};
type Account = {
  authenticated: boolean;
  ready: boolean;
  message?: string;
  profileName: string | null;
  preferences: Preference | null;
  favorites: {
    id: string;
    alertsEnabled: boolean;
    region: { name: string; code: string };
  }[];
  favoriteZones: FavoriteZone[];
  notices: { id: string; title: string; message: string; createdAt: string }[];
};
export function PersonalRegions({
  variant = 'home',
  externalId,
}: {
  variant?: 'home' | 'favorites' | 'alerts' | 'settings' | 'zone';
  externalId?: string;
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
        const r = await fetch('/api/account', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!r.ok) throw new Error('ACCOUNT');
        const data = await r.json();
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
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    void load();
    window.addEventListener('jeongbi-account-changed', refresh);
    window.addEventListener('jeongbi-auth-state', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      controller.abort();
      window.removeEventListener('jeongbi-account-changed', refresh);
      window.removeEventListener('jeongbi-auth-state', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [pathname, revision]);
  const title =
    variant === 'settings'
      ? '프로필·알림 설정'
      : variant === 'zone'
        ? '관심 정비구역'
        : variant === 'favorites'
          ? '내 관심지역·구역 관리'
          : '관심지역 새 소식';
  const savedZone = state?.favoriteZones?.find(
    (f) => f.zone.externalId === externalId,
  );
  return (
    <section
      className="section personal-regions"
      id={variant === 'zone' ? 'official-zone-save' : undefined}
    >
      <div className="section-heading">
        <h2>{title}</h2>
        {variant !== 'settings' && <Link href="/account">관심지역 관리 →</Link>}
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
          <p>로그인하고 내 관심지역을 저장하세요.</p>
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
      ) : variant === 'settings' ? (
        <>
          <ProfileForm name={state.profileName} />
          <NotificationPreferenceForm value={state.preferences} />
        </>
      ) : variant === 'zone' && externalId ? (
        <div className="personal-edit">
          {savedZone ? (
            <>
              <p>내 관심구역에 저장되어 있습니다.</p>
              <OfficialZoneSettings
                id={savedZone.id}
                enabled={savedZone.alertsEnabled}
              />
              <RemoveOfficialZone id={savedZone.id} />
            </>
          ) : (
            <SaveOfficialZone externalId={externalId} />
          )}
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
              <FavoriteForm selected="26230" ready />
              {state.favorites.map((f) => (
                <article className="panel personal-edit" key={f.id}>
                  <strong>{f.region.name}</strong>
                  <FavoriteSettings id={f.id} enabled={f.alertsEnabled} />
                  <RemoveFavorite id={f.id} />
                </article>
              ))}
            </>
          )}
          {variant !== 'alerts' && (
            <div className="saved-official-zones">
              <h3>저장한 정비구역</h3>
              {!state.favoriteZones?.length ? (
                <p>
                  관심 정비구역이 없습니다. 공식 구역 상세에서 저장해 보세요.
                </p>
              ) : (
                state.favoriteZones.map((f) => (
                  <article className="panel personal-edit" key={f.id}>
                    <Link href={'/zones/' + f.zone.externalId}>
                      {f.zone.name}
                    </Link>
                    {variant === 'favorites' && (
                      <>
                        <OfficialZoneSettings
                          id={f.id}
                          enabled={f.alertsEnabled}
                        />
                        <RemoveOfficialZone id={f.id} />
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
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
