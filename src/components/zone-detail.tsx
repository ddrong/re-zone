'use client';
import { PersonalRegions } from './personal-regions';
import { DetailPage } from './prototype-views';
import { KakaoMap } from './kakao-map';
import { ListingResources } from './listing-resources';
import { usePrototype } from './prototype-shell';
import type { PublicZone } from '@/lib/public-zones';
export function ZoneDetail({
  zone,
  mapKey = '',
}: {
  zone: PublicZone;
  mapKey?: string;
}) {
  const ctx = usePrototype();
  const toggle = () =>
    zone.demo
      ? ctx.toggleFavorite(zone.id)
      : document
          .getElementById('official-zone-save')
          ?.scrollIntoView({ block: 'center' });
  return (
    <>
      {!zone.demo && (
        <section className="official-status">
          <strong>부산시 실제 정비사업 공개자료</strong>
          <p>{zone.address || zone.district}</p>
          {zone.area && <p>구역면적: {zone.area} ㎡</p>}
          <small>
            원본 갱신일: {zone.date} · 조회:{' '}
            {zone.retrievedAt
              ? new Date(zone.retrievedAt).toLocaleString('ko-KR', {
                  timeZone: 'Asia/Seoul',
                })
              : '확인 필요'}
          </small>
          <a href={zone.sourceUrl} target="_blank" rel="noopener noreferrer">
            부산시 원문 확인 ↗
          </a>
        </section>
      )}
      {!zone.demo && (
        <KakaoMap
          apiKey={mapKey}
          zones={[zone]}
          district={zone.district}
          selectedId={zone.id}
        />
      )}
      {!zone.demo && <PersonalRegions variant="zone" externalId={zone.id} />}
      <DetailPage
        zone={zone}
        isFavorite={zone.demo && ctx.favorites.includes(zone.id)}
        onToggleFavorite={toggle}
        onNavigate={ctx.navigate}
      />
      <ListingResources />
    </>
  );
}
