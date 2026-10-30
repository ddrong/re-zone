'use client';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  CalendarDays,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { OfficialZoneFavorite } from './official-zone-favorite';
import { KakaoMap } from './kakao-map';
import { ListingResources } from './listing-resources';
import type { PublicZone } from '@/lib/public-zones';

import { businessStageGuide as guide } from '@/lib/regions';
export function ZoneDetail({
  zone,
  mapKey = '',
}: {
  zone: PublicZone;
  mapKey?: string;
}) {
  const hasStage =
    Number.isInteger(zone.stage) && zone.stage >= 1 && zone.stage <= 8;
  return (
    <div className="official-detail">
      <section className="official-zone-hero">
        <div className="zone-eyebrow">
          <span
            className={'pill ' + (zone.type === '재건축' ? 'blue' : 'mint')}
          >
            {zone.type}
          </span>
          <span>부산시 공식 공개자료</span>
        </div>
        <h1>{zone.name}</h1>
        <p className="zone-location">
          <MapPin size={18} aria-hidden="true" />
          {zone.address || zone.district || '위치 미제공'}
        </p>
        <div className="official-zone-facts">
          <div>
            <Layers size={20} />
            <small>공식 사업추진단계</small>
            <strong>{zone.stageName}</strong>
          </div>
          <div>
            <Building2 size={20} />
            <small>구역면적</small>
            <strong>
              {zone.area ? zone.area + ' ㎡' : '원본 자료 미제공'}
            </strong>
          </div>
          <div>
            <CalendarDays size={20} />
            <small>원본 갱신일</small>
            <strong>{zone.date || '원본 자료 미제공'}</strong>
          </div>
        </div>
        <div className="zone-hero-actions">
          <OfficialZoneFavorite externalId={zone.id} />
          <a
            className="button-secondary"
            href={zone.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            공식자료 원문 <ExternalLink size={15} />
          </a>
        </div>
        <small className="tiny-note">
          앱 조회:{' '}
          {zone.retrievedAt
            ? new Date(zone.retrievedAt).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
              })
            : '확인 필요'}{' '}
          · 원본 자료의 최신성을 보장하지 않습니다.
        </small>
      </section>
      <section className="section official-stage-card">
        <div className="section-heading">
          <h2>정비사업 진행 단계</h2>
          <span className="pill">원본: {zone.stageName}</span>
        </div>
        <ol
          className="official-stage-guide"
          aria-label="공식 단계명을 묶은 UI 안내"
        >
          {guide.map((label, index) => (
            <li
              key={label}
              className={hasStage && index + 1 === zone.stage ? 'current' : ''}
              aria-current={
                hasStage && index + 1 === zone.stage ? 'step' : undefined
              }
            >
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </li>
          ))}
        </ol>
        <p className="tiny-note">
          {hasStage
            ? '강조 표시는 원본 단계명을 8개 안내 그룹에 대응한 것입니다.'
            : '현재 단계를 안내 그룹으로 확정할 수 없어 강조하지 않았습니다.'}{' '}
          법적 단계의 확정, 사업 진행률 또는 완료 이력을 뜻하지 않습니다. 정확한
          상태는 공식 원문을 확인하세요.
        </p>
      </section>
      <div className="official-detail-grid">
        <section className="zone-map-card">
          <h2>정비구역 위치</h2>
          <KakaoMap
            apiKey={mapKey}
            zones={[zone]}
            district={zone.district}
            selectedId={zone.id}
          />
        </section>
        <section className="section zone-save-card" id="official-zone-save">
          <h2>나의 관심 정비구역</h2>
          <p>등록한 구역은 MY와 관심 화면에서 다시 확인할 수 있습니다.</p>
          <OfficialZoneFavorite externalId={zone.id} />
          <Link className="button-secondary" href="/favorites">
            관심구역 전체 보기 →
          </Link>
          <p className="tiny-note">
            주소로 확인한 위치 안내이며 정비구역 경계가 아닙니다. 확인되지 않은
            위치는 임의로 표시하지 않습니다.
          </p>
        </section>
      </div>
      <ListingResources />
      <div className="bottom-cta official-detail-cta">
        <OfficialZoneFavorite externalId={zone.id} compact />
        <Link className="button-secondary" href="/analysis">
          수익 분석 →
        </Link>
      </div>
    </div>
  );
}
