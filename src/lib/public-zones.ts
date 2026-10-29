import { districts } from './regions';
export type PublicZone = {
  id: string;
  name: string;
  district: string;
  type: string;
  stage: number;
  stageName: string;
  status: string;
  date: string;
  color: string;
  demo: boolean;
  address?: string;
  area?: string;
  sourceUrl?: string;
  retrievedAt?: string;
};
const ORIGIN = 'https://dynamice.busan.go.kr';
export function stageNumber(value: string) {
  if (/해제|취소/.test(value)) return 0;
  if (/준공|입주|착공/.test(value)) return 8;
  if (/이주|철거/.test(value)) return 7;
  if (/관리처분/.test(value)) return 6;
  if (/사업시행/.test(value)) return 5;
  if (/조합설립|조합 설립/.test(value)) return 4;
  if (/추진위원/.test(value)) return 3;
  if (/구역|정비계획/.test(value)) return 2;
  if (/기본계획/.test(value)) return 1;
  return 0;
}
function text(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}
export function parseOfficialList(
  html: string,
  type: string,
  district = '',
  page = 1,
) {
  const list = html.match(
    /<ul class="board-list-ul ty02">([\s\S]*?)<\/ul>/,
  )?.[1];
  if (list === undefined) throw new Error('SOURCE_FORMAT_CHANGED');
  const rows: PublicZone[] = [];
  for (const match of list.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
    const block = match[1];
    const id = block.match(/getPopupData\(this,'(BARA_\d{13})'\)/)?.[1];
    const name = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1];
    const fields = [...block.matchAll(/<span>([\s\S]*?)<\/span>/g)].map((m) =>
      text(m[1]),
    );
    if (!id || !name) continue;
    const address =
      fields.find((v) => v.startsWith('주소'))?.replace(/^주소\s*:\s*/, '') ??
      '';
    const stage =
      fields
        .find((v) => v.startsWith('사업추진단계'))
        ?.replace(/^사업추진단계\s*:\s*/, '') ?? '단계 미제공';
    const region =
      district ||
      districts.find((d) => address.includes(d.name))?.name ||
      '지역 확인 필요';
    rows.push({
      id,
      name: text(name),
      district: region,
      type,
      stage: stageNumber(stage),
      stageName: stage,
      status: stage,
      date: '원본 갱신일 미제공',
      color: 'mint',
      demo: false,
      address,
      sourceUrl: ORIGIN + '/view.do?no=' + (type === '재건축' ? '274' : '273'),
    });
  }
  const pages = [...html.matchAll(/linkPage\((\d+)\)/g)].map((m) =>
    Number(m[1]),
  );
  return { rows, hasMore: pages.some((n) => n > page) };
}
async function officialFetch(url: URL) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    redirect: 'error',
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error('SOURCE_UNAVAILABLE');
  const body = await response.text();
  if (body.length > 1500000) throw new Error('SOURCE_TOO_LARGE');
  return body;
}
export async function searchOfficialZones({
  q = '',
  district = '',
  type = '',
  page = 1,
}: {
  q?: string;
  district?: string;
  type?: string;
  page?: number;
}) {
  const chosen = districts.find((d) => d.code === district);
  const index = chosen ? districts.findIndex((d) => d.code === district) : -1;
  const types = type ? [type] : ['재개발', '재건축'];
  const results = await Promise.allSettled(
    types.map(async (kind) => {
      const url = new URL('/view.do', ORIGIN);
      url.searchParams.set('no', kind === '재건축' ? '274' : '273');
      url.searchParams.set('pageIndex', String(page));
      if (q) url.searchParams.set('sw', q);
      if (index >= 0)
        url.searchParams.set(
          'sigun_gbn_id',
          'CMCD_' + String(263 + index).padStart(13, '0'),
        );
      return parseOfficialList(
        await officialFetch(url),
        kind,
        chosen?.name ?? '',
        page,
      );
    }),
  );
  const fulfilled = results.flatMap((r) =>
    r.status === 'fulfilled' ? [r.value] : [],
  );
  if (!fulfilled.length) throw new Error('SOURCE_UNAVAILABLE');
  return {
    zones: fulfilled.flatMap((r) => r.rows),
    hasMore: fulfilled.some((r) => r.hasMore),
    partial: fulfilled.length !== results.length,
    page,
    retrievedAt: new Date().toISOString(),
    source: '부산광역시 정비사업 통합홈페이지',
    sourceUrl: ORIGIN + '/view.do?no=273',
  };
}
export async function getOfficialZone(id: string): Promise<PublicZone | null> {
  if (!/^BARA_\d{13}$/.test(id)) return null;
  const url = new URL('/dnmc/portal/bnscrntst/getPopupData.do', ORIGIN);
  url.searchParams.set('busi_ara_id', id);
  const raw: unknown = JSON.parse(await officialFetch(url));
  if (!raw || typeof raw !== 'object' || !('busiareaVo' in raw))
    throw new Error('SOURCE_FORMAT_CHANGED');
  const value = raw.busiareaVo;
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const field = (key: string) =>
    typeof item[key] === 'string' ? text(item[key] as string) : '';
  const name = field('areaName') || field('busiAraNm');
  if (!name) return null;
  const type = /재건축/.test(name) ? '재건축' : '재개발';
  const stage = field('busiProcStepName') || '단계 미제공';
  return {
    id,
    name,
    district: field('sigunGbnNm') || '지역 확인 필요',
    type,
    stage: stageNumber(stage),
    stageName: stage,
    status: stage,
    date: field('modiDthms') || '원본 갱신일 미제공',
    color: 'mint',
    demo: false,
    address: field('location') || field('lctnBunji'),
    area: field('areaUnit'),
    retrievedAt: new Date().toISOString(),
    sourceUrl: ORIGIN + '/view.do?no=' + (type === '재건축' ? '274' : '273'),
  };
}
