import type { PublicZone } from './public-zones';
export function verifiedMapAddress(zone: PublicZone): string | null {
  if (zone.demo || !zone.address) return null;
  const raw = zone.address
    .replace(/<[^>]*>/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/일원/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/\d/.test(raw) || !/(동|로|길|리|읍|면)/.test(raw) || raw.length > 200)
    return null;
  const full = raw.startsWith('부산')
    ? raw
    : '부산광역시 ' +
      (raw.includes(zone.district) ? '' : zone.district + ' ') +
      raw;
  return /부산/.test(full) && !full.includes('지역 확인 필요') ? full : null;
}
export function kakaoSearchLink(query: string) {
  return 'https://map.kakao.com/link/search/' + encodeURIComponent(query);
}
