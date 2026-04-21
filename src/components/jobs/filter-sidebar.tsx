'use client';

import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { JobFilter, JobType, EmploymentType, ExperienceLevel, JobStatus } from '@/types/job';

interface FilterSidebarProps {
  filter: JobFilter;
  onFilterChange: (filter: JobFilter) => void;
}

/** 필터에 사용할 직무 유형 목록 */
const JOB_TYPES: JobType[] = [
  'SRE',
  'Cloud',
  'MLOps',
  'Platform',
  'DevOps',
  'Infrastructure',
  'System',
];

/** 필터에 사용할 고용 형태 목록 */
const EMPLOYMENT_TYPES: EmploymentType[] = ['정규직', '계약직', '인턴'];

/** 필터에 사용할 경력 요건 목록 */
const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  '신입',
  '1년 이상',
  '3년 이상',
  '5년 이상',
  '무관',
];

/** 필터에 사용할 공고 상태 목록 */
const JOB_STATUSES: JobStatus[] = ['진행중', '검토중', '마감'];

/** 필터에 사용할 기술스택 목록 */
const TECH_STACKS: string[] = [
  'Kubernetes', 'Terraform', 'AWS', 'GCP', 'Azure', 'Docker',
  'Prometheus', 'Ansible', 'Helm', 'ArgoCD', 'Jenkins',
  'GitHub Actions', 'Grafana', 'Datadog', 'Linux', 'Python', 'Go',
];

/**
 * 공고 목록 필터 사이드바 컴포넌트
 */
export function FilterSidebar({ filter, onFilterChange }: FilterSidebarProps) {
  /** 활성화된 필터 수 계산 */
  const activeFilterCount =
    (filter.jobTypes?.length ?? 0) +
    (filter.employmentType ? 1 : 0) +
    (filter.experienceLevels?.length ?? 0) +
    (filter.status ? 1 : 0) +
    (filter.techStack?.length ?? 0);

  /** 직무 유형 토글 */
  const toggleJobType = (type: JobType) => {
    const current = filter.jobTypes ?? [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFilterChange({ ...filter, jobTypes: next.length > 0 ? next : undefined });
  };

  /** 고용 형태 선택 */
  const selectEmploymentType = (type: EmploymentType) => {
    onFilterChange({
      ...filter,
      employmentType: filter.employmentType === type ? undefined : type,
    });
  };

  /** 경력 요건 토글 (다중 선택) */
  const toggleExperienceLevel = (level: ExperienceLevel) => {
    const current = filter.experienceLevels ?? [];
    const next = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    onFilterChange({ ...filter, experienceLevels: next.length > 0 ? next : undefined });
  };

  /** 공고 상태 선택 */
  const selectStatus = (status: JobStatus) => {
    onFilterChange({
      ...filter,
      status: filter.status === status ? undefined : status,
    });
  };

  /** 기술스택 토글 */
  const toggleTechStack = (tech: string) => {
    const current = filter.techStack ?? [];
    const next = current.includes(tech)
      ? current.filter((t) => t !== tech)
      : [...current, tech];
    onFilterChange({ ...filter, techStack: next.length > 0 ? next : undefined });
  };

  /** 전체 필터 초기화 */
  const resetFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="space-y-5 rounded-lg border bg-card p-4">
      {/* 필터 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">필터</h2>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-7 gap-1 text-xs text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            초기화 ({activeFilterCount})
          </Button>
        )}
      </div>

      <Separator />

      {/* 직무 유형 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">직무 유형</p>
        <div className="flex flex-wrap gap-1.5">
          {JOB_TYPES.map((type) => (
            <Badge
              key={type}
              variant={filter.jobTypes?.includes(type) ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => toggleJobType(type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* 고용 형태 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">고용 형태</p>
        <div className="flex flex-wrap gap-1.5">
          {EMPLOYMENT_TYPES.map((type) => (
            <Badge
              key={type}
              variant={filter.employmentType === type ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => selectEmploymentType(type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* 경력 요건 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">경력 요건</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE_LEVELS.map((level) => (
            <Badge
              key={level}
              variant={filter.experienceLevels?.includes(level) ? 'outline' : 'default'}
              className="cursor-pointer text-xs"
              onClick={() => toggleExperienceLevel(level)}
            >
              {level}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* 공고 상태 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">공고 상태</p>
        <div className="flex flex-wrap gap-1.5">
          {JOB_STATUSES.map((status) => (
            <Badge
              key={status}
              variant={filter.status === status ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => selectStatus(status)}
            >
              {status}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* 기술스택 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">기술스택</p>
        <div className="flex flex-wrap gap-1.5">
          {TECH_STACKS.map((tech) => (
            <Badge
              key={tech}
              variant={filter.techStack?.includes(tech) ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => toggleTechStack(tech)}
            >
              {tech}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
