export const districts = [
  { code: '26110', name: '중구' },
  { code: '26140', name: '서구' },
  { code: '26170', name: '동구' },
  { code: '26200', name: '영도구' },
  { code: '26230', name: '부산진구' },
  { code: '26260', name: '동래구' },
  { code: '26290', name: '남구' },
  { code: '26320', name: '북구' },
  { code: '26350', name: '해운대구' },
  { code: '26380', name: '사하구' },
  { code: '26410', name: '금정구' },
  { code: '26440', name: '강서구' },
  { code: '26470', name: '연제구' },
  { code: '26500', name: '수영구' },
  { code: '26530', name: '사상구' },
  { code: '26710', name: '기장군' },
] as const;
export const stageNames = [
  '정비계획',
  '구역지정',
  '조합설립',
  '사업시행인가',
  '관리처분인가',
  '착공',
  '준공',
];
export type ZoneView = {
  id: string;
  name: string;
  district: string;
  districtCode: string;
  type: string;
  stage: string;
  address: string;
  area: string | null;
  source: string;
  sourceUrl: string | null;
  updated: string | null;
  events: { stage: string; date: string | null; notice: string | null }[];
  demo: boolean;
};
export const demoZones: ZoneView[] = districts.map((district, index) => ({
  id: 'demo-' + district.code,
  name: district.name + ' 가람' + (index + 1) + ' 시연구역',
  district: district.name,
  districtCode: district.code,
  type: index % 3 === 0 ? '재건축' : '재개발',
  stage: stageNames[index % stageNames.length],
  address: '부산광역시 ' + district.name + ' · 가상의 위치',
  area: String(24000 + index * 3100),
  source: '정비ON AI 시연용 가상 데이터',
  sourceUrl: null,
  updated: null,
  events: [{ stage: '구역지정', date: null, notice: '시연용 이력입니다.' }],
  demo: true,
}));
export function filterZones(
  zones: ZoneView[],
  query: string,
  district: string,
  type: string,
) {
  const keyword = query.trim().toLocaleLowerCase('ko-KR');
  return zones.filter(
    (zone) =>
      (!district || zone.districtCode === district) &&
      (!type || zone.type === type) &&
      (!keyword ||
        (zone.name + ' ' + zone.address)
          .toLocaleLowerCase('ko-KR')
          .includes(keyword)),
  );
}
