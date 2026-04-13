import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h1 className="text-5xl font-bold tracking-tight">StarterKit</h1>
        <p className="text-lg text-muted-foreground">
          Next.js 15 · NextAuth · Prisma · Zustand · TanStack Query · shadcn/ui
        </p>
      </div>

      <div className="flex gap-3">
        {session?.user ? (
          <Button asChild size="lg">
            <Link href="/dashboard">대시보드로 이동</Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg">
              <Link href="/sign-in">시작하기</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-up">회원가입</Link>
            </Button>
          </>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        빠른 웹 개발을 위한 프로덕션 준비 완료 스타터킷
      </p>
    </div>
  );
}
