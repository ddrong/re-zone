import { Suspense } from 'react';
import { connection } from 'next/server';
import { PublicExplorer } from '@/components/public-explorer';
import { searchOfficialZones } from '@/lib/public-zones';
import { districts } from '@/lib/regions';
export const metadata = { title: '지역 탐색' };
export default function Areas({
  searchParams,
}: {
  searchParams: Promise<{ district?: string }>;
}) {
  return (
    <Suspense
      fallback={<p role="status">부산시 공식 공개자료를 불러오는 중입니다…</p>}
    >
      <InitialSearch searchParams={searchParams} />
    </Suspense>
  );
}
async function InitialSearch({
  searchParams,
}: {
  searchParams: Promise<{ district?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const selected = districts.find((d) => d.code === params.district);
  let result = null;
  try {
    result = await searchOfficialZones({ district: selected?.code ?? '' });
  } catch {
    /* PublicExplorer displays a safe error and allows another search. */
  }
  return (
    <PublicExplorer
      initialDistrict={selected?.name ?? ''}
      initialResult={result}
    />
  );
}
