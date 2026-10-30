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

export const businessStageGuide = [
  '기본계획',
  '정비계획·구역지정',
  '추진위원회',
  '조합설립',
  '사업시행',
  '관리처분',
  '이주·철거',
  '착공·준공',
];
