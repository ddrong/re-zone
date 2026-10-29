'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AreasPage } from './prototype-views';
import { usePrototype } from './prototype-shell';
import { KakaoMap } from './kakao-map';
import { zones } from '@/lib/prototype-data';
import { districts } from '@/lib/regions';
import type { PublicZone } from '@/lib/public-zones';
type Result = {
  zones: PublicZone[];
  hasMore: boolean;
  partial: boolean;
  retrievedAt: string;
  sourceUrl: string;
  total: number;
  districtCounts: Record<string, number>;
};
export function PublicExplorer({
  initialStage = '',
  initialDistrict = '',
  initialResult = null,
  initialQuery = '',
  initialType = '전체',
  initialPage = 1,
  initialMode = 'official',
}: {
  initialStage?: string;
  initialDistrict?: string;
  initialResult?: Result | null;
  initialQuery?: string;
  initialType?: string;
  initialPage?: number;
  initialMode?: string;
}) {
  const [stage, setStage] = useState(initialStage);
  const [lastSuccess, setLastSuccess] = useState(
    initialResult?.retrievedAt ?? '',
  );
  const [mode, setMode] = useState(initialMode);
  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState(initialQuery);
  const [district, setDistrict] = useState(initialDistrict);
  const [page, setPage] = useState(initialPage);
  const [result, setResult] = useState<Result | null>(initialResult);
  const [loading, setLoading] = useState(
    !initialResult && initialMode === 'official',
  );
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const ctx = usePrototype();
  const router = useRouter();
  useEffect(() => {
    const query = new URLSearchParams();
    if (stage) query.set('stage', stage);
    if (search) query.set('q', search);
    const code = districts.find((d) => d.name === district)?.code;
    if (code) query.set('district', code);
    if (type !== '전체') query.set('type', type);
    if (page > 1) query.set('page', String(page));
    if (mode === 'demo') query.set('mode', 'demo');
    if (new URLSearchParams(window.location.search).get('auth_success') === '1')
      query.set('auth_success', '1');
    const target = '/areas' + (query.size ? '?' + query : '');
    if (
      window.location.pathname === '/areas' &&
      window.location.pathname + window.location.search !== target
    )
      window.history.replaceState(null, '', target);
  }, [mode, type, search, district, page, stage]);
  useEffect(() => {
    if (mode !== 'official') return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      const query = new URLSearchParams({
        q: search,
        stage,
        type: type === '전체' ? '' : type,
        district: districts.find((d) => d.name === district)?.code ?? '',
        page: String(page),
      });
      try {
        const response = await fetch('/api/public-zones?' + query, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          if (data.lastSuccessAt) setLastSuccess(data.lastSuccessAt);
          throw new Error('SOURCE_UNAVAILABLE');
        }
        setResult(data);
        setLastSuccess(data.retrievedAt);
      } catch {
        if (!controller.signal.aborted) {
          setResult(null);
          setError(
            '공식 공개자료를 불러오지 못했습니다. 다시 시도하거나 부산시 원문을 확인해 주세요.',
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [mode, type, search, district, page, stage, retry]);
  const demo = zones.filter(
    (z) =>
      (type === '전체' || z.type === type) &&
      (!district || z.district.includes(district)) &&
      (z.name + ' ' + z.district).includes(search.trim()),
  );
  const visible = mode === 'official' ? (result?.zones ?? []) : demo;
  const openZone = (id: string) => ctx.openZone(id);
  return (
    <div className="explorer-workspace">
      <div className="data-mode-switch" role="group" aria-label="자료 구분">
        <button
          className={mode === 'official' ? 'selected' : ''}
          onClick={() => {
            setMode('official');
            setPage(1);
          }}
        >
          부산시 공식 공개자료
        </button>
        <button
          className={mode === 'demo' ? 'selected' : ''}
          onClick={() => {
            setMode('demo');
            setPage(1);
          }}
        >
          시연용 가상 데이터
        </button>
      </div>
      <div
        className={mode === 'official' ? 'official-status' : 'demo-status'}
        role="status"
      >
        {mode === 'official' ? (
          <>
            <strong>실제 정비사업 공개자료</strong>
            <span>
              {loading
                ? '부산시 자료를 조회 중입니다…'
                : error ||
                  `검색 결과 ${result?.total ?? 0}곳 · 현재 페이지 ${result?.zones.length ?? 0}곳`}
            </span>
            {error && (
              <button
                className="text-action"
                onClick={() => setRetry((n) => n + 1)}
              >
                다시 조회
              </button>
            )}
            {error && (
              <small>
                최종 성공 조회:{' '}
                {lastSuccess
                  ? new Date(lastSuccess).toLocaleString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                    })
                  : '기록 없음'}
              </small>
            )}
            {result?.partial && (
              <span>일부 사업유형의 조회가 실패했습니다.</span>
            )}
            {result && (
              <small>
                앱 조회:{' '}
                {new Date(result.retrievedAt).toLocaleString('ko-KR', {
                  timeZone: 'Asia/Seoul',
                })}{' '}
                · 원본 갱신일은 상세에서 별도 확인
              </small>
            )}
            <a
              href="https://dynamice.busan.go.kr/view.do?no=273"
              target="_blank"
              rel="noopener noreferrer"
            >
              부산시 공식 출처 ↗
            </a>
          </>
        ) : (
          <>
            <strong>시연용 가상 데이터</strong>
            <span>
              실제 정비사업 정보가 아니며 가상 구역에 임의 마커를 표시하지
              않습니다.
            </span>
          </>
        )}
      </div>
      <div className="stage-search-filter">
        <label htmlFor="stage-filter">추진 단계</label>
        <select
          id="stage-filter"
          value={stage}
          onChange={(e) => {
            setStage(e.target.value);
            setPage(1);
          }}
        >
          <option value="">전체 단계</option>
          {[
            '미확정',
            '기본계획',
            '구역 지정',
            '추진위원회',
            '조합 설립',
            '사업시행',
            '관리처분',
            '이주·철거',
            '착공·준공',
          ].map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <AreasPage
        onSearch={() => {
          setPage(1);
          setRetry((n) => n + 1);
        }}
        suggestions={(result?.zones ?? []).map((z) => z.name)}
        areaType={type}
        setAreaType={(v: string) => {
          setType(v);
          setPage(1);
        }}
        search={search}
        setSearch={(v: string) => {
          setSearch(v.slice(0, 80));
          setPage(1);
        }}
        districtFilter={district}
        setDistrictFilter={(v: string) => {
          setDistrict(v);
          setPage(1);
        }}
        zones={visible}
        favorites={ctx.favorites}
        onToggleFavorite={(id: string) => {
          const zone = visible.find((z) => z.id === id);
          if (zone && !zone.demo) {
            router.push(
              '/zones/' + encodeURIComponent(zone.id) + '#official-zone-save',
            );
            return;
          }
          ctx.toggleFavorite(id);
        }}
        onOpenZone={openZone}
        official={mode === 'official'}
        loading={mode === 'official' && loading}
        mapPanel={
          <div id="region-map">
            <KakaoMap
              zones={mode === 'official' ? visible : []}
              district={district}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        }
      />
      {mode === 'official' && result && (
        <div className="regional-counts" aria-label="검색 조건별 지역 건수">
          {districts.map((d) => (
            <button
              key={d.code}
              onClick={() => {
                setDistrict(d.name);
                setPage(1);
              }}
            >
              {d.name} {result.districtCounts?.[d.code] ?? 0}
            </button>
          ))}
        </div>
      )}
      {mode === 'official' && (
        <div className="public-pagination">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage((n) => n - 1)}
          >
            이전
          </button>
          <span>{page}페이지</span>
          <button
            disabled={!result?.hasMore || loading}
            onClick={() => setPage((n) => n + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
