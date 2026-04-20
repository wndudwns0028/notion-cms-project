import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 transition-all duration-300">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
