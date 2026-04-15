'use client';

import { JobFilter } from '@/types/job';
import { FilterSidebar } from '@/components/jobs/filter-sidebar';

interface SidebarProps {
  filter: JobFilter;
  onFilterChange: (filter: JobFilter) => void;
}

/**
 * 공고 목록 페이지에서 사용하는 필터 사이드바 래퍼
 */
export function Sidebar({ filter, onFilterChange }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0">
      <FilterSidebar filter={filter} onFilterChange={onFilterChange} />
    </aside>
  );
}
