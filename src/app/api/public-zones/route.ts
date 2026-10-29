import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { districts } from '@/lib/regions';
import { searchOfficialZones } from '@/lib/public-zones';
const query = z.object({
  q: z.string().max(80),
  district: z.string().refine((v) => !v || districts.some((d) => d.code === v)),
  type: z.enum(['', '재개발', '재건축']),
  page: z.coerce.number().int().min(1).max(100),
});
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const parsed = query.safeParse({
    q: p.get('q') ?? '',
    district: p.get('district') ?? '',
    type: p.get('type') ?? '',
    page: p.get('page') ?? '1',
  });
  if (!parsed.success)
    return NextResponse.json(
      { message: '검색 조건을 확인해 주세요.' },
      { status: 400 },
    );
  try {
    return NextResponse.json(await searchOfficialZones(parsed.data), {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch {
    return NextResponse.json(
      {
        message:
          '부산시 공개자료를 불러오지 못했습니다. 잠시 후 다시 시도하거나 공식 출처를 확인해 주세요.',
      },
      { status: 502 },
    );
  }
}
