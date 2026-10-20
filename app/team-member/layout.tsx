"use client";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { AppSidebar, SidebarNav } from "@/components/layout/app-sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileSidebarProvider, MobileSidebar, HamburgerButton } from "@/components/layout/MobileSidebar";

import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

export default function TeamMemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hydrated, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);

  const isSubPage = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.startsWith("/team-member/justificaciones/") ||
      pathname.startsWith("/team-member/justificar") ||
      pathname.startsWith("/team-member/marcar")
    );
  }, [pathname]);

  if (!hydrated || checkingAuth) {
    return (<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>);
  }
  return (
    <div className="flex min-h-screen w-full">
      <MobileSidebarProvider>
        <AppSidebar />
        <MobileSidebar>
          <SidebarNav onNavigate={() => {}} />
        </MobileSidebar>
        <div className="flex-1 min-w-0 md:ml-[290px] flex flex-col min-h-screen relative bg-background">
          {/* Mobile Top Header (hidden on sub/detail pages) */}
          {!isSubPage && <MobileHeader />}

          {/* Ambient light for all screens in dark mode (50px higher, 100px left) */}
          <div className="absolute top-[-300px] right-0 w-[600px] h-[450px] bg-violet/10 dark:bg-violet/20 blur-[140px] rounded-full pointer-events-none hidden dark:block z-0" />
          <div className="absolute top-[-130px] right-[200px] w-[350px] h-[250px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none hidden dark:block z-0" />

          <main className={`flex-1 p-4 md:p-6 bg-transparent relative z-10 ${isSubPage ? "pb-8" : "pb-24 md:pb-6"}`}>
            {children}
          </main>

          {/* Mobile Bottom Navigation (hidden on sub/detail pages) */}
          {!isSubPage && <MobileBottomNav basePath="/team-member" />}
        </div>
      </MobileSidebarProvider>
    </div>
  );
}
