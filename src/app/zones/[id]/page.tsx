import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { getOfficialZone } from '@/lib/public-zones';
import { ZoneDetail } from '@/components/zone-detail';
import { getPublicKakaoMapKey } from '@/lib/kakao-map-config';
export const metadata = { title: '구역 상세 분석' };
export default function ZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p role="status">구역 정보를 조회하고 있습니다…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}
async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^BARA_\d{13}$/.test(id)) notFound();
  let zone;
  try {
    zone = await getOfficialZone(id);
  } catch {
    return (
      <section className="official-status" role="alert">
        <strong>공식 자료 조회에 실패했습니다.</strong>
        <p>시연 자료로 바꾸지 않았습니다. 잠시 후 다시 시도해 주세요.</p>
        <Link href="/areas">지역 탐색으로 돌아가기</Link>
      </section>
    );
  }
  if (!zone) notFound();
  return <ZoneDetail zone={zone} mapKey={getPublicKakaoMapKey()} />;
}
