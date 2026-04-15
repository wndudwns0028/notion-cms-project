import { NextResponse } from 'next/server';
import { getJobs } from '@/lib/notion';

/**
 * GET /api/jobs
 * 채용공고 목록을 Notion DB에서 가져옴
 * Query params:
 *   - cursor: 페이지네이션 커서
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') ?? undefined;

    const data = await getJobs(cursor);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/jobs] 오류:', error);
    return NextResponse.json({ error: '공고 목록을 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}
