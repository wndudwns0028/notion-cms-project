"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/ui-store";
import { Menu, LogOut, User } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-full items-center gap-4 px-4">
        {/* 사이드바 토글 버튼 */}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">사이드바 토글</span>
        </Button>

        {/* 로고 */}
        <Link href="/" className="font-bold text-lg tracking-tight">
          StarterKit
        </Link>

        {/* 우측 영역 */}
        <div className="ml-auto flex items-center gap-2">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={session.user.image ?? ""}
                      alt={session.user.name ?? "사용자"}
                    />
                    <AvatarFallback>
                      {session.user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    대시보드
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/sign-in">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
