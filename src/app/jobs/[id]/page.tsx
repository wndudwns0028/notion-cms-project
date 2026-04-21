import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookmarkButton } from '@/components/jobs/bookmark-button';
import { getJobById } from '@/lib/notion';
import type { Metadata } from 'next';
import type { RichTextItem, Job } from '@/types/job';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 동적 메타데이터 생성
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) {
    return { title: '공고를 찾을 수 없습니다' };
  }

  return {
    title: `${job.title} - ${job.company}`,
    description: job.responsibilities.map((r) => r.plain_text).join(' ').slice(0, 160),
  };
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
 * Notion Rich Text 배열을 단순 문자열로 변환
 */
function richTextToPlainText(items: RichTextItem[]): string {
  return items.map((item) => item.plain_text).join('');
}

/**
 * Rich Text 블록을 렌더링하는 컴포넌트
 */
function RichTextBlock({ items, emptyMessage = '내용 없음' }: { items: RichTextItem[]; emptyMessage?: string }) {
  const text = richTextToPlainText(items);
  if (!text) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  // 줄바꿈 기준으로 문단 분리하여 표시
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
          {line}
        </li>
      ))}
    </ul>
  );
}

/**
 * 공고 상세 페이지 (/jobs/[id])
 */
export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>

        {/* 공고 헤더 */}
        <div className="mb-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{job.company || '회사 미상'}</span>
              </div>
              <h1 className="text-2xl font-bold leading-tight">{job.title}</h1>
            </div>
            <BookmarkButton jobId={id} />
          </div>

          {/* 직무 유형 배지 */}
          <div className="flex flex-wrap gap-1.5">
            {job.jobTypes.map((type) => (
              <Badge key={type} variant="secondary">
                {type}
              </Badge>
            ))}
            {job.status && (
                <Badge variant="outline" className={getStatusClassName(job.status)}>
                  {job.status}
                </Badge>
              )}
          </div>

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {job.platform && <span>플랫폼: {job.platform}</span>}
            {job.employmentType && <span>고용형태: {job.employmentType}</span>}
            {job.experienceLevel && <span>경력: {job.experienceLevel}</span>}
            {job.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                마감일: {job.deadline}
              </span>
            )}
            {job.collectedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                수집일: {job.collectedAt}
              </span>
            )}
          </div>

          {/* 기술스택 */}
          {job.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {job.techStack.map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          )}

          {/* 공고 원문 링크 */}
          {job.jobUrl && (
            <a href={job.jobUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="default" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                공고 원문 보기
              </Button>
            </a>
          )}
        </div>

        <Separator className="my-6" />

        {/* 담당업무 */}
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">담당업무</h2>
          <RichTextBlock items={job.responsibilities} emptyMessage="담당업무 정보 없음" />
        </section>

        <Separator className="my-6" />

        {/* 자격요건 */}
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">자격요건</h2>
          <RichTextBlock items={job.requirements} emptyMessage="자격요건 정보 없음" />
        </section>

        <Separator className="my-6" />

        {/* 우대사항 */}
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">우대사항</h2>
          <RichTextBlock items={job.preferredQualifications} emptyMessage="우대사항 정보 없음" />
        </section>

        {/* 메모 */}
        {richTextToPlainText(job.memo) && (
          <>
            <Separator className="my-6" />
            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">메모</h2>
              <RichTextBlock items={job.memo} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
