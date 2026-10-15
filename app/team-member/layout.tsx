"use client";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { AppSidebar, SidebarNav } from "@/components/layout/app-sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileSidebarProvider, MobileSidebar, HamburgerButton } from "@/components/layout/MobileSidebar";

export default function TeamMemberLayout({ children }: { children: React.ReactNode }) {
  const { hydrated, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
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
        <main className="flex-1 min-w-0 md:ml-[268px] overflow-x-hidden overflow-y-auto p-4 md:p-6 bg-background pb-6 md:pb-6 relative">
          {/* Ambient light for all screens in dark mode (Figma official position) */}
          <div className="fixed top-[-40px] right-[-40px] w-[600px] h-[600px] bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-transparent blur-[130px] rounded-full pointer-events-none hidden dark:block z-0" />
          <div className="fixed top-[60px] right-[80px] w-[350px] h-[350px] bg-cyan-400/15 blur-[100px] rounded-full pointer-events-none hidden dark:block z-0" />

          <div className="absolute top-4 right-4 z-50"><NotificationBell /></div>
          <div className="md:hidden mb-4"><HamburgerButton /></div>
          <div className="relative z-10 bg-transparent min-h-screen">
            {children}
          </div>
        </main>
      </MobileSidebarProvider>
    </div>
  );
}
