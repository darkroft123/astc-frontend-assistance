"use client";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { AppSidebar, SidebarNav } from "@/components/layout/app-sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileSidebarProvider, MobileSidebar } from "@/components/layout/MobileSidebar";
import { ArrowLeft } from "lucide-react";

import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

function getSubPageInfo(pathname: string | null): { isSubPage: boolean; title: string; backHref: string } {
  if (!pathname) return { isSubPage: false, title: "", backHref: "/team-member" };
  if (pathname.startsWith("/team-member/justificaciones/")) {
    return { isSubPage: true, title: "Justificaciones", backHref: "/team-member/justificaciones" };
  }
  if (pathname.startsWith("/team-member/justificar")) {
    return { isSubPage: true, title: "Justificar falta", backHref: "/team-member/justificaciones" };
  }
  if (pathname.startsWith("/team-member/marcar") || pathname.startsWith("/team-member/registrar/prev")) {
    return { isSubPage: true, title: "Asistencia", backHref: "/team-member" };
  }
  return { isSubPage: false, title: "", backHref: "/team-member" };
}

export default function TeamMemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);

  const subPageInfo = useMemo(() => getSubPageInfo(pathname), [pathname]);
  const isSubPage = subPageInfo.isSubPage;

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
          {/* Mobile Top Header: Global Header OR Subpage Header (Image 5) covering edge to edge */}
          {!isSubPage ? (
            <MobileHeader />
          ) : (
            <div className="md:hidden sticky top-0 z-40 w-full bg-white dark:bg-[#0C0E18] border-b border-border dark:border-[#1E2335] px-4 h-14 flex items-center justify-between shadow-xs">
              <button
                type="button"
                onClick={() => router.push(subPageInfo.backHref)}
                className="flex items-center gap-2.5 text-[#6D28D9] dark:text-[#C4B5FD] font-semibold text-[17px] tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                <span>{subPageInfo.title}</span>
              </button>
              <div className="shrink-0 flex items-center pr-0.5">
                <NotificationBell iconOnly />
              </div>
            </div>
          )}

          {/* Ambient light for all screens in dark mode (50px higher, 100px left) */}
          <div className="absolute top-[-200px] left-[180px] md:left-[220px] w-[440px] h-[300px] bg-violet/08 dark:bg-violet/10 blur-[130px] rounded-full pointer-events-none hidden md:dark:block z-0" />
          <div className="absolute top-[-80px] left-[260px] w-[260px] h-[190px] bg-indigo-500/05 dark:bg-indigo-500/06 blur-[100px] rounded-full pointer-events-none hidden md:dark:block z-0" />

          <main className={`flex-1 p-4 md:px-8 bg-transparent relative z-10 ${isSubPage ? "md:pt-2 pb-8" : "md:pt-5 pb-24 md:pb-6"}`}>
            {children}
          </main>

          {/* Mobile Bottom Navigation (hidden on sub/detail pages) */}
          {!isSubPage && <MobileBottomNav basePath="/team-member" />}
        </div>
      </MobileSidebarProvider>
    </div>
  );
}