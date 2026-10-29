import { Suspense } from 'react';
import { connection } from 'next/server';
import { PublicExplorer } from '@/components/public-explorer';
import { searchOfficialZones } from '@/lib/public-zones';
import { districts } from '@/lib/regions';
export const metadata = { title: '지역 탐색' };
type Params = Promise<{
  district?: string;
  q?: string;
  type?: string;
  page?: string;
  mode?: string;
}>;
export default function Areas({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense
      fallback={<p role="status">부산시 공식 공개자료를 불러오는 중입니다…</p>}
    >
      <InitialSearch searchParams={searchParams} />
    </Suspense>
  );
}
async function InitialSearch({ searchParams }: { searchParams: Params }) {
  await connection();
  const p = await searchParams;
  const district = districts.find((d) => d.code === p.district);
  const query = typeof p.q === 'string' ? p.q.slice(0, 80) : '';
  const type =
    typeof p.type === 'string' && ['재개발', '재건축'].includes(p.type)
      ? p.type
      : '';
  const page = Number(p.page);
  const validPage =
    Number.isInteger(page) && page >= 1 && page <= 100 ? page : 1;
  const mode = p.mode === 'demo' ? 'demo' : 'official';
  let result = null;
  if (mode === 'official')
    try {
      result = await searchOfficialZones({
        district: district?.code ?? '',
        q: query,
        type,
        page: validPage,
      });
    } catch {
      /* Never substitute demo records for failed official searches. */
    }
  return (
    <PublicExplorer
      initialDistrict={district?.name ?? ''}
      initialResult={result}
      initialQuery={query}
      initialType={type || '전체'}
      initialPage={validPage}
      initialMode={mode}
    />
  );
}
