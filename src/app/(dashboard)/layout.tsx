import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버에서 세션 검증 (미들웨어 이중 보호)
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 transition-all duration-300">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
