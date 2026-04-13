import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
};

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          안녕하세요, {session?.user?.name ?? "사용자"}님!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">데이터를 불러오는 중...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">활성 세션</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1</p>
            <p className="text-xs text-muted-foreground">현재 로그인 중</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">내 역할</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">
              {session?.user?.role ?? "user"}
            </p>
            <p className="text-xs text-muted-foreground">현재 권한 레벨</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
