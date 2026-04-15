import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { TechStackChart } from '@/components/stats/tech-stack-chart';
import { JobTypeChart } from '@/components/stats/job-type-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTechStackStats, getJobTypeStats } from '@/lib/notion';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '통계/분석',
};

/** 통계 카드 로딩 상태 표시 */
function StatsSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * 기술스택 차트 서버 컴포넌트
 */
async function TechStackSection() {
  const data = await getTechStackStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>기술스택별 공고 수</CardTitle>
        <p className="text-sm text-muted-foreground">채용공고에 등장하는 기술스택 빈도 (상위 15개)</p>
      </CardHeader>
      <CardContent>
        <TechStackChart data={data} limit={15} />
      </CardContent>
    </Card>
  );
}

/**
 * 직무 유형 차트 서버 컴포넌트
 */
async function JobTypeSection() {
  const data = await getJobTypeStats();
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>직무 유형 분포</CardTitle>
        <p className="text-sm text-muted-foreground">전체 공고 중 직무 유형별 비율</p>
      </CardHeader>
      <CardContent>
        <JobTypeChart data={data} />
        {/* 집계 테이블 */}
        {data.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.name}</span>
                <span>
                  {item.count}개{' '}
                  <span className="text-xs text-muted-foreground">
                    ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 통계/분석 페이지 (/stats)
 * Notion DB의 공고 데이터를 집계하여 차트로 시각화
 */
export default function StatsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">통계/분석</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            채용공고 데이터를 기반으로 기술스택 트렌드를 파악하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Suspense fallback={<StatsSkeleton />}>
            <TechStackSection />
          </Suspense>

          <Suspense fallback={<StatsSkeleton />}>
            <JobTypeSection />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
