import 'server-only';
import { getDb } from './db';
import { districts, demoZones, type ZoneView } from './regions';
export type Catalog = {
  zones: ZoneView[];
  mode: 'live' | 'demo';
  reason: 'empty' | 'unavailable' | null;
};
export async function getCatalog(): Promise<Catalog> {
  try {
    const rows = await getDb().redevelopmentZone.findMany({
      take: 500,
      orderBy: { updatedAt: 'desc' },
      where: { region: { code: { startsWith: '26' } } },
      include: {
        region: { include: { parent: true } },
        source: true,
        currentStage: true,
        stageEvents: {
          take: 20,
          orderBy: { effectiveDate: 'desc' },
          include: { stage: true },
        },
      },
    });
    if (!rows.length)
      return { zones: demoZones, mode: 'demo', reason: 'empty' };
    return {
      mode: 'live',
      reason: null,
      zones: rows.map((row) => ({
        id: row.id,
        name: row.name,
        district:
          districts.find((d) => d.code === row.region.code.slice(0, 5))?.name ??
          row.region.name,
        districtCode: row.region.code.slice(0, 5),
        type:
          row.projectType === 'REDEVELOPMENT'
            ? '재개발'
            : row.projectType === 'RECONSTRUCTION'
              ? '재건축'
              : '기타',
        stage: row.currentStage?.name ?? '단계 확인 중',
        address: row.address ?? '주소 확인 중',
        area: row.areaM2?.toString() ?? null,
        source: row.source.name,
        sourceUrl: row.source.referenceUrl.startsWith('https://')
          ? row.source.referenceUrl
          : null,
        updated: row.sourceUpdatedAt?.toISOString() ?? null,
        events: row.stageEvents.map((event) => ({
          stage: event.stage.name,
          date: event.effectiveDate?.toISOString().slice(0, 10) ?? null,
          notice: event.noticeNumber,
        })),
        demo: false,
      })),
    };
  } catch {
    console.error('catalog_read_failed');
    return { zones: demoZones, mode: 'demo', reason: 'unavailable' };
  }
}
