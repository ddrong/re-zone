'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Building2, Search, Sparkles, MapPin, Calculator } from 'lucide-react';
import { districts } from '@/lib/regions';
import { PersonalRegions } from './personal-regions';
import type { PublicZone } from '@/lib/public-zones';
type Summary = {
  zones: PublicZone[];
  total: number;
  partial: boolean;
  retrievedAt: string;
  districtCounts: Record<string, number>;
  typeCounts: Record<string, number>;
};
export function DashboardHome() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public-zones', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('SOURCE');
        return r.json();
      })
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, []);
  const count = (value?: number) =>
    value === undefined ? '—' : value.toLocaleString('ko-KR');
  return (
    <div className="dashboard-home">
      <section className="busan-hero">
        <div className="welcome-copy">
          <span className="eyebrow">BUSAN · 정비사업을 한눈에</span>
          <h1>
            부산의 변화를 켜다,
            <br />
            <em>정비ON AI</em>
          </h1>
          <p>공식 정비사업 정보부터 나의 관심지역까지</p>
          <form className="hero-search" action="/areas" role="search">
            <Search size={22} />
            <label className="sr-only" htmlFor="home-search">
              통합 검색
            </label>
            <input
              id="home-search"
              name="q"
              maxLength={80}
              placeholder="가야1, 구역명 또는 부산 구·군 검색"
            />
            <button className="button-primary">검색</button>
          </form>
        </div>
        <Image
          className="hero-oni"
          src="/assets/oni.png"
          width={1122}
          height={1402}
          alt="정비ON 마스코트 온이"
          priority
        />
        <div className="busan-scenery" aria-hidden="true">
          <span>BUSAN</span>
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </section>
      <section className="dashboard-stats" aria-label="공식 정비사업 조회 현황">
        {[
          ['공식 조회 사업', data?.total],
          ['재개발', data?.typeCounts?.['재개발']],
          ['재건축', data?.typeCounts?.['재건축']],
          ['부산 구·군', 16],
        ].map(([label, value]) => (
          <article className="content-card" key={label}>
            <Building2 size={21} />
            <span>{label}</span>
            <strong>
              {count(value as number | undefined)}
              <small>{label === '부산 구·군' ? '개' : '곳'}</small>
            </strong>
          </article>
        ))}
      </section>
      <p className="tiny-note" role="status">
        {error
          ? '공식자료 조회에 실패했습니다. 지역 탐색에서 다시 조회해 주세요.'
          : !data
            ? '부산시 공식 공개자료를 조회하고 있습니다.'
            : (data.partial
                ? '일부 자료의 조회 결과입니다. 전체 현황이 아닙니다. '
                : '공식 공개 목록을 집계했습니다. ') +
              '조회: ' +
              new Date(data.retrievedAt).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
              })}
      </p>
      <div className="home-dashboard-grid">
        <section className="section district-dashboard">
          <div className="section-heading">
            <h2>
              <MapPin size={21} />
              부산 구·군별 현황
            </h2>
            <Link href="/areas">전체 보기 →</Link>
          </div>
          <div className="district-dashboard-grid">
            {districts.map((d) => (
              <Link key={d.code} href={'/areas?district=' + d.code}>
                <span>{d.name}</span>
                <strong>
                  {count(data?.districtCounts?.[d.code])}
                  <small>곳</small>
                </strong>
              </Link>
            ))}
          </div>
          <small>
            원문 주소로 구·군을 확인한 자료 기준 · 주소 미제공 자료 제외
          </small>
        </section>
        <PersonalRegions />
        <section className="section top-zones">
          <div className="section-heading">
            <h2>주목할 정비구역 TOP 3</h2>
            <Link href="/areas">모두 보기 →</Link>
          </div>
          <p className="tiny-note">
            공식 목록 순 첫 3개 사업 · 투자 순위나 추천이 아닙니다.
          </p>
          {data?.zones.slice(0, 3).map((z, i) => (
            <Link className="dashboard-zone" key={z.id} href={'/zones/' + z.id}>
              <b>{i + 1}</b>
              <span>
                <strong>{z.name}</strong>
                <small>
                  {z.district} · {z.type}
                </small>
              </span>
              <span className="pill">{z.stageName}</span>
            </Link>
          ))}
          {!data && (
            <p>
              {error ? '공식자료를 불러오지 못했습니다.' : '정비구역 조회 중…'}
            </p>
          )}
        </section>
        <section className="section ai-overview">
          <div className="section-heading">
            <h2>
              <Sparkles size={21} />
              AI 한눈에 분석
            </h2>
          </div>
          <p>
            현재 제공하는 분석은 공식 사업단계 안내와 입력값 계산입니다. AI 자동
            분석은 준비 중입니다.
          </p>
          <Link className="analysis-entry" href="/analysis">
            <Calculator />
            <span>
              <strong>내 조건으로 수익 계산</strong>
              <small>직접 입력한 금액으로 비용과 손익 살펴보기</small>
            </span>
            →
          </Link>
          <Link className="button-secondary" href="/areas">
            사업단계·공식 출처 확인하기
          </Link>
        </section>
      </div>
    </div>
  );
}
