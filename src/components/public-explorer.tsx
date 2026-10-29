'use client';
import { useEffect, useState } from 'react';

import { AreasPage } from './prototype-views';
import { usePrototype } from './prototype-shell';
import { zones } from '@/lib/prototype-data';
import { districts } from '@/lib/regions';
import type { PublicZone } from '@/lib/public-zones';
type Result = {
  zones: PublicZone[];
  hasMore: boolean;
  partial: boolean;
  retrievedAt: string;
  sourceUrl: string;
};
export function PublicExplorer({
  initialDistrict = '',
  initialResult = null,
}: {
  initialDistrict?: string;
  initialResult?: Result | null;
}) {
  const preset = initialDistrict;
  const [mode, setMode] = useState('official');
  const [type, setType] = useState('전체');
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState(preset);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result | null>(initialResult);
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState('');
  const ctx = usePrototype();
  useEffect(() => {
    if (mode !== 'official') return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      const query = new URLSearchParams({
        q: search,
        type: type === '전체' ? '' : type,
        district: districts.find((d) => d.name === district)?.code ?? '',
        page: String(page),
      });
      try {
        const response = await fetch('/api/public-zones?' + query, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('SOURCE_UNAVAILABLE');
        setResult(await response.json());
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
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [mode, type, search, district, page]);
  const demo = zones.filter(
    (z) =>
      (type === '전체' || z.type === type) &&
      (!district || z.district.includes(district)) &&
      (z.name + ' ' + z.district).includes(search.trim()),
  );
  const visible = mode === 'official' ? (result?.zones ?? []) : demo;
  return (
    <>
      <div className="data-mode-switch" role="group" aria-label="자료 구분">
        <button
          className={mode === 'official' ? 'selected' : ''}
          onClick={() => setMode('official')}
        >
          부산시 공식 공개자료
        </button>
        <button
          className={mode === 'demo' ? 'selected' : ''}
          onClick={() => setMode('demo')}
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
                  '부산시 공개 목록 조회 결과입니다. 전체 건수가 아닌 현재 페이지 결과입니다.'}
            </span>
            {result?.partial && (
              <span>일부 사업유형의 조회가 실패했습니다.</span>
            )}
            {result && (
              <small>
                조회 시각:{' '}
                {new Date(result.retrievedAt).toLocaleString('ko-KR', {
                  timeZone: 'Asia/Seoul',
                })}{' '}
                · 원본 갱신일은 별도 확인
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
            <span>구역·매물·가격·단계는 실제 사업 정보가 아닙니다.</span>
          </>
        )}
      </div>
      <AreasPage
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
            ctx.navigate('account');
            return;
          }
          ctx.toggleFavorite(id);
        }}
        onOpenZone={ctx.openZone}
        official={mode === 'official'}
        loading={mode === 'official' && loading}
      />
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
    </>
  );
}
