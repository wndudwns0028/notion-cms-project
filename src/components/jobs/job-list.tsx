'use client';

import { JobCard } from '@/components/jobs/job-card';
import { Loader2 } from 'lucide-react';
import type { Job } from '@/types/job';

interface JobListProps {
  jobs: Job[];
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * 채용공고 카드 그리드 목록 컴포넌트
 */
export function JobList({ jobs, isLoading, emptyMessage = '공고가 없습니다.' }: JobListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">{emptyMessage}</p>
        <p className="mt-1 text-sm">필터 조건을 변경하거나 Notion DB에 공고를 추가해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
