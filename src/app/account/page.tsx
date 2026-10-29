import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { getAuthUser } from '@/lib/supabase';
import { getAccount } from '@/lib/account';
import { districts } from '@/lib/regions';
import { FavoriteForm, RemoveFavorite } from '@/components/favorite-form';
import { signOut } from '@/app/auth/actions';
export const metadata = { title: '내 관심지역' };
export default function Account({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; notice?: string }>;
}) {
  return (
    <section id="main" className="container account-page">
      <Suspense fallback={<p role="status">관심지역을 불러오는 중입니다…</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
async function Content({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; notice?: string }>;
}) {
  await connection();
  const user = await getAuthUser();
  if (!user)
    return (
      <section className="empty-state">
        <p className="eyebrow">YOUR OWN BUSAN</p>
        <h1>관심지역을 모아보세요.</h1>
        <p>
          회원으로 로그인하면 나만의 관심지역을 저장할 수 있습니다.
          <br />
          정비사업 정보는 로그인 없이 열람할 수 있어요.
        </p>
        <div className="button-group">
          <Link className="button primary" href="/login">
            로그인
          </Link>
          <Link className="button secondary" href="/">
            사업 둘러보기
          </Link>
        </div>
      </section>
    );
  const state = await getAccount(user.id);
  const params = await searchParams;
  const selected = districts.some((d) => d.code === params.district)
    ? params.district!
    : districts[0].code;
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">MY INTEREST</p>
          <h1>내 관심지역</h1>
          <p className="muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="button secondary">로그아웃</button>
        </form>
      </div>
      {params.notice === 'logout-failed' && (
        <p role="alert" className="notice">
          로그아웃하지 못했습니다. 다시 시도해 주세요.
        </p>
      )}
      {!state.ready && (
        <aside className="notice">
          관심지역 저장 서비스 준비 중입니다. 기존 정보는 변경하지 않았습니다.
        </aside>
      )}
      <section className="panel">
        <FavoriteForm selected={selected} ready={state.ready} />
      </section>
      <div className="results-heading">
        <h2>
          저장한 지역 <span>{state.user?.favoriteRegions.length ?? 0}</span>
        </h2>
      </div>
      {!state.user?.favoriteRegions.length ? (
        <div className="empty-state">
          <h3>아직 저장한 지역이 없습니다.</h3>
          <p>위에서 관심 있는 구·군을 선택해 보세요.</p>
        </div>
      ) : (
        <div className="favorite-grid">
          {state.user.favoriteRegions.map((item) => (
            <article className="panel favorite-card" key={item.id}>
              <span className="eyebrow">BUSAN</span>
              <h2>{item.region.name}</h2>
              <Link href={'/areas?district=' + item.region.code.slice(0, 5)}>
                정비사업 둘러보기 →
              </Link>
              <RemoveFavorite id={item.id} />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
