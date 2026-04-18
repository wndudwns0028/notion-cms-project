'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { FilterSidebar } from '@/components/jobs/filter-sidebar';
import { JobList } from '@/components/jobs/job-list';
import { Input } from '@/components/ui/input';
import type { Job, JobFilter, JobsResponse } from '@/types/job';

/**
 * 공고 목록을 API에서 가져오는 fetcher 함수
 */
async function fetchJobs(): Promise<JobsResponse> {
  const response = await fetch('/api/jobs');
  if (!response.ok) {
    throw new Error('공고 목록을 불러오는 데 실패했습니다.');
  }
  return response.json() as Promise<JobsResponse>;
}

/**
 * 필터와 검색어를 기준으로 공고 목록 필터링
 */
function applyFilter(jobs: Job[], filter: JobFilter): Job[] {
  return jobs.filter((job) => {
    // 검색어 필터 (공고명, 회사명 대상)
    if (filter.search) {
      const keyword = filter.search.toLowerCase();
      const matchesTitle = job.title.toLowerCase().includes(keyword);
      const matchesCompany = job.company.toLowerCase().includes(keyword);
      if (!matchesTitle && !matchesCompany) return false;
    }

    // 직무 유형 필터
    if (filter.jobTypes && filter.jobTypes.length > 0) {
      const hasType = job.jobTypes.some((type) => filter.jobTypes!.includes(type));
      if (!hasType) return false;
    }

    // 고용 형태 필터
    if (filter.employmentType && job.employmentType !== filter.employmentType) {
      return false;
    }

    // 경력 요건 필터
    if (filter.experienceLevel && job.experienceLevel !== filter.experienceLevel) {
      return false;
    }

    // 공고 상태 필터
    if (filter.status && job.status !== filter.status) {
      return false;
    }

    // 기술스택 필터 (선택한 기술 중 하나라도 포함하면 통과)
    if (filter.techStack && filter.techStack.length > 0) {
      const hasTech = job.techStack.some((tech) => filter.techStack!.includes(tech));
      if (!hasTech) return false;
    }

    return true;
  });
}

/**
 * 공고 목록 홈 페이지 (/)
 * Notion DB에서 공고를 가져와 필터 사이드바와 함께 카드 그리드로 표시
 */
export default function HomePage() {
  const [filter, setFilter] = useState<JobFilter>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    staleTime: 60 * 1000, // 1분 캐시
    retry: 1,
  });

  // 필터와 검색어를 합쳐서 적용
  const filteredJobs = useMemo(() => {
    const jobs = data?.jobs ?? [];
    return applyFilter(jobs, { ...filter, search: searchQuery });
  }, [data?.jobs, filter, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* 페이지 제목 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">인프라/운영 채용공고</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            SRE, Cloud, MLOps 등 인프라 직군 공고를 한눈에 확인하세요.
          </p>
        </div>

        {/* 검색창 */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="공고명, 회사명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-6">
          {/* 필터 사이드바 */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <FilterSidebar filter={filter} onFilterChange={setFilter} />
          </aside>

          {/* 공고 목록 */}
          <div className="min-w-0 flex-1">
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">공고를 불러오는 데 실패했습니다.</p>
                <p className="mt-1 text-sm">
                  Notion API 키와 DB ID 환경변수를 확인해 주세요.
                </p>
              </div>
            ) : (
              <>
                {!isLoading && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    총 {filteredJobs.length}개 공고
                  </p>
                )}
                <JobList jobs={filteredJobs} isLoading={isLoading} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
