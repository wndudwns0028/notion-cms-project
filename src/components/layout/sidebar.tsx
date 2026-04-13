"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "사용자", icon: Users },
  { href: "/dashboard/settings", label: "설정", icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen } = useUIStore();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
