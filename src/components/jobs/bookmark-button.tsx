'use client';

import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookmarkStore } from '@/stores/bookmark-store';

interface BookmarkButtonProps {
  jobId: string;
}

export function BookmarkButton({ jobId }: BookmarkButtonProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarkStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // hydration 불일치 방지 — 마운트 전에는 비활성 상태로 렌더링
  const bookmarked = isMounted && isBookmarked(jobId);

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={bookmarked ? '북마크 제거' : '북마크 추가'}
      aria-pressed={bookmarked}
      onClick={() => toggleBookmark(jobId)}
      className={bookmarked ? 'text-primary border-primary' : ''}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
    </Button>
  );
}
