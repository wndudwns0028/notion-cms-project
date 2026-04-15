'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, BarChart2, Bookmark, BookOpen, Telescope } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 상단 네비게이션 메뉴 항목 */
const navItems = [
  { href: '/', label: '공고 목록', icon: Briefcase },
  { href: '/stats', label: '통계/분석', icon: BarChart2 },
  { href: '/bookmarks', label: '북마크', icon: Bookmark },
  { href: '/guide', label: '입력 가이드', icon: BookOpen },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Telescope className="h-5 w-5 text-primary" />
          <span>JobLens</span>
        </Link>

        {/* 메인 네비게이션 */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                pathname === item.href
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
