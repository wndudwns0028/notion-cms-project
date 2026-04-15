'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { JobList } from '@/components/jobs/job-list';
import { Button } from '@/components/ui/button';
import { useBookmarkStore } from '@/stores/bookmark-store';
import { Trash2 } from 'lucide-react';
import type { Job, JobsResponse } from '@/types/job';

/**
 * 전체 공고 목록을 가져오는 fetcher
 */
async function fetchAllJobs(): Promise<Job[]> {
  const response = await fetch('/api/jobs');
  if (!response.ok) {
    throw new Error('공고 목록을 불러오는 데 실패했습니다.');
  }
  const data = (await response.json()) as JobsResponse;
  return data.jobs;
}

/**
 * 북마크 목록 페이지 (/bookmarks)
 * Zustand 스토어의 북마크 ID 목록을 기준으로 공고를 필터링하여 표시
 */
export default function BookmarksPage() {
  // hydration 불일치 방지: 클라이언트 마운트 후에만 북마크 데이터 사용
  const [isMounted, setIsMounted] = useState(false);
  const { bookmarkedIds, clearBookmarks } = useBookmarkStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: allJobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchAllJobs,
    staleTime: 60 * 1000,
    retry: 1,
    enabled: isMounted,
  });

  // 북마크된 공고만 필터링
  const bookmarkedJobs = allJobs?.filter((job) => bookmarkedIds.includes(job.id)) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">북마크</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              저장한 공고를 모아볼 수 있습니다.
            </p>
          </div>
          {isMounted && bookmarkedIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearBookmarks}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              전체 삭제
            </Button>
          )}
        </div>

        {!isMounted ? (
          // 서버/클라이언트 hydration 전 빈 상태
          <div />
        ) : (
          <JobList
            jobs={bookmarkedJobs}
            isLoading={isLoading}
            emptyMessage="북마크한 공고가 없습니다."
          />
        )}
      </main>
    </div>
  );
}
