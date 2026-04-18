'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBookmarkStore } from '@/stores/bookmark-store';
import type { Job } from '@/types/job';

interface JobCardProps {
  job: Job;
}

function getStatusClassName(status: string | null): string {
  switch (status) {
    case '진행중':
    case '진행 중':
      return 'bg-green-100 text-green-800 border-green-200';
    case '마감':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case '검토중':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return '';
  }
}

/**
 * 채용공고 카드 컴포넌트
 */
export function JobCard({ job }: JobCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(job.id);

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* 회사명 */}
            <div className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{job.company || '회사 미상'}</span>
            </div>
            {/* 공고명 */}
            <Link
              href={`/jobs/${job.id}`}
              className="line-clamp-2 font-semibold leading-snug hover:underline"
            >
              {job.title || '공고명 없음'}
            </Link>
          </div>
          {/* 북마크 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => toggleBookmark(job.id)}
            aria-label={bookmarked ? '북마크 해제' : '북마크 추가'}
          >
            {bookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {/* 직무 유형 배지 */}
        {job.jobTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.jobTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        )}

        {/* 기술스택 배지 (최대 5개) */}
        {job.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.techStack.slice(0, 5).map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
            {job.techStack.length > 5 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{job.techStack.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* 고용형태 / 경력요건 */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {job.employmentType && <span>{job.employmentType}</span>}
          {job.experienceLevel && <span>{job.experienceLevel}</span>}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0">
        {/* 마감일 */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {job.deadline && (
            <>
              <Calendar className="h-3.5 w-3.5" />
              <span>마감 {job.deadline}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 상태 배지 */}
          {job.status && (
            <Badge variant="outline" className={`text-xs ${getStatusClassName(job.status)}`}>
              {job.status}
            </Badge>
          )}
          {/* 외부 링크 */}
          {job.jobUrl && (
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="공고 원문 보기"
            >
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
