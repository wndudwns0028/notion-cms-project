import { NextResponse } from 'next/server';
import { getJobById } from '@/lib/notion';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/jobs/[id]
 * 특정 채용공고를 Notion에서 가져옴
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: '공고를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('[GET /api/jobs/[id]] 오류:', error);
    return NextResponse.json({ error: '공고를 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}
