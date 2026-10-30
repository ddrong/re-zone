'use client';
import Script from 'next/script';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { PublicZone } from '@/lib/public-zones';
import { verifiedMapAddress, kakaoSearchLink } from '@/lib/map-location';
type Position = { getLat: () => number; getLng: () => number };
type MapInstance = {
  setCenter: (p: Position) => void;
  setLevel: (level: number) => void;
  relayout: () => void;
};
type MarkerInstance = { setMap: (map: MapInstance | null) => void };
type InfoInstance = {
  open: (map: MapInstance, marker: MarkerInstance) => void;
  close: () => void;
};
type GeoResult = {
  x: string;
  y: string;
  address?: { region_1depth_name?: string; region_2depth_name?: string };
};
type Maps = {
  load: (fn: () => void) => void;
  LatLng: new (lat: number, lng: number) => Position;
  Map: new (
    node: HTMLElement,
    options: { center: Position; level: number },
  ) => MapInstance;
  Marker: new (options: {
    map: MapInstance;
    position: Position;
    title: string;
  }) => MarkerInstance;
  InfoWindow: new (options: {
    content: HTMLElement;
    removable: boolean;
  }) => InfoInstance;
  services: {
    Geocoder: new () => {
      addressSearch: (
        address: string,
        callback: (results: GeoResult[], status: string) => void,
      ) => void;
    };
    Status: { OK: string };
  };
  event: {
    addListener: (target: MarkerInstance, type: string, fn: () => void) => void;
    removeListener: (
      target: MarkerInstance,
      type: string,
      fn: () => void,
    ) => void;
  };
};
declare global {
  interface Window {
    kakao?: { maps: Maps };
  }
}
export function KakaoMap({
  apiKey,
  zones,
  district = '',
  selectedId,
  onSelect,
}: {
  apiKey: string;
  zones: PublicZone[];
  district?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const key = apiKey.trim();
  const node = useRef<HTMLDivElement>(null);
  const instance = useRef<MapInstance | null>(null);
  const addressCache = useRef(new Map<string, Promise<GeoResult | null>>());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [markerCount, setMarkerCount] = useState(0);
  const selection = useRef(onSelect);
  useEffect(() => {
    selection.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!key || ready || failed) return;
    const timeout = setTimeout(() => setFailed(true), 15000);
    return () => clearTimeout(timeout);
  }, [key, ready, failed]);
  const selected = zones.find((z) => z.id === selectedId);
  const searchAddress = selected ? verifiedMapAddress(selected) : null;
  const locationQuery = searchAddress || '부산광역시 ' + district;
  useEffect(() => {
    if (!ready || !node.current || !window.kakao) return;
    if (!instance.current) return;
    const map = instance.current;
    const observer = new ResizeObserver(() => map.relayout());
    observer.observe(node.current);
    map.relayout();
    return () => observer.disconnect();
  }, [ready]);
  useEffect(() => {
    if (!ready || !instance.current || !window.kakao) return;
    const maps = window.kakao.maps;
    const map = instance.current;
    const geo = new maps.services.Geocoder();
    let cancelled = false;
    let count = 0;
    const markers: { marker: MarkerInstance; click: () => void }[] = [];
    const infoWindows: InfoInstance[] = [];
    const geocode = (address: string) => {
      const cached = addressCache.current.get(address);
      if (cached) return cached;
      const pending = new Promise<GeoResult | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 6000);
        geo.addressSearch(address, (results, status) => {
          clearTimeout(timeout);
          resolve(
            status === maps.services.Status.OK ? (results[0] ?? null) : null,
          );
        });
      });
      addressCache.current.set(address, pending);
      return pending;
    };
    const located = async () => {
      if (district) {
        const r = await geocode('부산광역시 ' + district);
        if (!cancelled && r) {
          map.setCenter(new maps.LatLng(Number(r.y), Number(r.x)));
          map.setLevel(7);
        }
      } else {
        map.setCenter(new maps.LatLng(35.1796, 129.0756));
        map.setLevel(9);
      }
      for (const zone of zones.slice(0, 20)) {
        const address = verifiedMapAddress(zone);
        if (!address) continue;
        const r = await geocode(address);
        if (cancelled) return;
        if (
          !r ||
          !['부산', '부산광역시'].includes(
            r.address?.region_1depth_name ?? '',
          ) ||
          !Number.isFinite(Number(r.x)) ||
          !Number.isFinite(Number(r.y))
        )
          continue;
        if (
          Number(r.y) < 34.8 ||
          Number(r.y) > 35.6 ||
          Number(r.x) < 128.6 ||
          Number(r.x) > 129.5
        )
          continue;
        if (
          zone.district !== '지역 확인 필요' &&
          r.address?.region_2depth_name !== zone.district
        )
          continue;
        const position = new maps.LatLng(Number(r.y), Number(r.x));
        const marker = new maps.Marker({ map, position, title: zone.name });
        count++;
        const content = document.createElement('div');
        content.className = 'map-info-window';
        const title = document.createElement('strong');
        title.textContent = zone.name;
        const note = document.createElement('p');
        note.textContent = zone.type + ' · ' + zone.stageName;
        const link = document.createElement('a');
        link.href = '/zones/' + encodeURIComponent(zone.id);
        link.textContent = '구역 상세보기';
        content.append(title, note, link);
        const info = new maps.InfoWindow({ content, removable: true });
        infoWindows.push(info);
        const click = () => {
          infoWindows.forEach((w) => w.close());
          info.open(map, marker);
          map.setCenter(position);
          selection.current?.(zone.id);
        };
        maps.event.addListener(marker, 'click', click);
        markers.push({ marker, click });
        if (zone.id === selectedId) {
          map.setCenter(position);
          map.setLevel(5);
          info.open(map, marker);
        }
      }
      if (!cancelled) setMarkerCount(count);
    };
    void located().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
      markers.forEach(({ marker, click }) => {
        maps.event.removeListener(marker, 'click', click);
        marker.setMap(null);
      });
      infoWindows.forEach((w) => w.close());
    };
  }, [ready, zones, district, selectedId]);
  return (
    <section
      className="map-panel"
      aria-label="카카오맵 위치 안내"
      data-map-key-configured={Boolean(key)}
      data-map-state={
        !key ? 'unconfigured' : failed ? 'failed' : ready ? 'ready' : 'loading'
      }
    >
      {key && !failed && (
        <Script
          id="jeongbi-kakao-sdk"
          src={
            'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' +
            encodeURIComponent(key) +
            '&autoload=false&libraries=services'
          }
          strategy="afterInteractive"
          onReady={() => {
            try {
              if (window.kakao)
                window.kakao.maps.load(() => {
                  try {
                    const maps = window.kakao?.maps;
                    if (!maps || !node.current) {
                      setFailed(true);
                      return;
                    }
                    if (!instance.current)
                      instance.current = new maps.Map(node.current, {
                        center: new maps.LatLng(35.1796, 129.0756),
                        level: 9,
                      });
                    setReady(true);
                  } catch {
                    setFailed(true);
                  }
                });
              else setFailed(true);
            } catch {
              setFailed(true);
            }
          }}
          onError={() => setFailed(true)}
        />
      )}
      <div className="map-heading">
        <strong>부산 {district || '전체'} 위치 안내</strong>
        <a
          href={kakaoSearchLink(locationQuery)}
          target="_blank"
          rel="noopener noreferrer"
        >
          카카오맵에서 열기 ↗
        </a>
      </div>
      {key && !failed ? (
        <>
          <div
            className="kakao-map-canvas"
            ref={node}
            aria-label="부산 정비사업 위치 지도"
          />
          {!ready && <p role="status">실제 카카오맵을 불러오는 중입니다…</p>}
        </>
      ) : (
        <div className="map-link-fallback">
          <strong>카카오맵으로 위치 확인</strong>
          <p>
            {failed
              ? '지도를 불러오지 못했습니다. 카카오맵 링크로 위치를 확인해 주세요.'
              : '지도 서비스 연결 전입니다. 아래 링크에서 실제 위치를 확인할 수 있습니다.'}
          </p>
          <a
            className="button-secondary"
            href={kakaoSearchLink(locationQuery)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {district || '부산 전체'} 지도 열기 ↗
          </a>
        </div>
      )}
      <p className="map-note">
        {ready && !failed ? '주소가 확인된 위치 ' + markerCount + '곳 · ' : ''}
        마커는 주소의 위치 안내이며 정비구역 경계가 아닙니다. 주소가 없는 자료는
        표시하지 않습니다.
      </p>
      {selected && (
        <div className="map-selection">
          <strong>{selected.name}</strong>
          <span>{selected.stageName}</span>
          <Link href={'/zones/' + selected.id}>선택한 구역 상세보기 →</Link>
        </div>
      )}
    </section>
  );
}
