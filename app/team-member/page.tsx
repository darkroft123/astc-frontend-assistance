"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { getDashboard } from "@/app/services/assistance.service";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { GeneralSummaryCard } from "@/components/dashboard/GeneralSummaryCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  User, Clock, XCircle, TrendingUp, AlertTriangle, FolderKanban, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "currentperiod"
  | "3months"
  | "6months"
  | "9months"
  | "total"
  | "custom";

interface DateRange {
  fromDate: string;
  toDate: string;
  label: string;
  period: Period;
}

interface Metrics {
  totalAttendances: number;
  totalAbsences: number;
  pendingJustifications: number;
}

const initialMetrics: Metrics = {
  totalAttendances: 0,
  totalAbsences: 0,
  pendingJustifications: 0,
};

const getInitialRange = (): DateRange => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    fromDate: formatDate(firstDay),
    toDate: formatDate(today),
    label: "Este mes",
    period: "month",
  };
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange());

  const { hydrated, token, user, role, checkingAuth } =
    useAuthGuard(["TEAM_MEMBER"]);
  const { project, projects, selectProject, loadingProject } = useUserProject();

  const displayName = user?.username ?? "Colaborador";
  const userFullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || displayName;

  const attendanceRate =
    metrics.totalAttendances + metrics.totalAbsences > 0
      ? Math.round(
          (metrics.totalAttendances /
            (metrics.totalAttendances + metrics.totalAbsences)) *
            100
        )
      : 0;

  useEffect(() => {
    if (!hydrated || checkingAuth || !token || !user) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoadingMetrics(true);
        const data = await getDashboard(
          token,
          dateRange.fromDate,
          dateRange.toDate,
          project?.id
        );
        if (cancelled) return;
        setMetrics({
          totalAttendances: data.totalAttendances,
          totalAbsences: data.totalAbsences,
          pendingJustifications: data.pendingJustifications,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (!cancelled) setLoadingMetrics(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    checkingAuth,
    token,
    user,
    project?.id,
    dateRange.fromDate,
    dateRange.toDate,
  ]);

  if (!hydrated || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!loadingProject && (!projects || projects.length === 0)) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full rounded-[16px] border border-amber/20 bg-card text-card-foreground shadow-xl p-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber/10 text-amber flex items-center justify-center mb-6 border border-amber/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-2xl mb-3 tracking-tight">Sin Proyecto Asignado</h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            No tienes un proyecto asignado actualmente. Contacta a tu administrador para que te asigne a un proyecto y puedas comenzar a registrar tus asistencias.
          </p>
        </Card>
      </div>
    );
  }

  const avatarSrc = formatAvatarUrl(user?.avatarUrl);

  const UserProfileCard = (
    <div className="col-span-12 lg:col-span-4">
      <Card className="h-full rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-md border-0 overflow-hidden text-primary-foreground flex flex-col justify-between">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 rounded-full border-2 border-primary-foreground/40 shadow-sm shrink-0">
              <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-card text-primary text-lg font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <span className="bg-card/20 text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {role === "TEAM_MEMBER" ? "Colaborador" : role === "PROJECT_MANAGER" ? "Jefe de Proyecto" : role === "ADMIN" ? "Administrador" : role || "Colaborador"}
              </span>
              <h2 className="text-base font-bold text-primary-foreground truncate mt-0.5">
                {userFullName}
              </h2>
              <p className="text-primary-foreground/80 text-xs truncate">
                {user?.email ?? "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-primary-foreground/15">
            <div className="bg-card/10 rounded-xl p-2.5">
              <p className="text-primary-foreground/70 text-[9px] uppercase tracking-wider font-semibold">USUARIO</p>
              <p className="text-primary-foreground text-xs font-bold truncate mt-0.5">
                {user?.username ?? "—"}
              </p>
            </div>

            <div className="bg-card/10 rounded-xl p-2.5">
              <p className="text-primary-foreground/70 text-[9px] uppercase tracking-wider font-semibold">PROYECTO</p>
              <p className="text-primary-foreground text-xs font-bold truncate mt-0.5">
                {project?.name || "Sin proyecto"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/50 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader
          title="Dashboard de Asistencia"
          description="Panel de control con el resumen de tu actividad y registro de asistencia"
          categoryTag={{ badge: "COLABORADOR", text: "Panel de Asistencia" }}
          period={dateRange.period}
          dateRange={dateRange}
          onPeriodChange={(newRange: DateRange) => setDateRange(newRange)}
        />

        {projects.length > 1 && (
          <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Proyecto Activo:
              </span>
              <select
                value={project?.id || ""}
                onChange={(e) => selectProject(e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {project && (
              <div className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                <span className="font-semibold">Horario: </span>
                <span>{project.workStartTime || "08:00"} - {project.workEndTime || "17:00"}</span>
              </div>
            )}
          </div>
        )}

        {loadingProject ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 my-6">
              <MetricCard
                icon={<User className="w-5 h-5" />}
                value={metrics.totalAttendances}
                title="Días presentes"
                subtitle="Jornadas completadas"
                badge="+5% vs mes ant."
                color="emerald"
              />

              <MetricCard
                icon={<Clock className="w-5 h-5" />}
                value={metrics.pendingJustifications}
                title="Requiere acción"
                subtitle="Por justificar"
                badge="Pendiente"
                color="amber"
              />

              <MetricCard
                icon={<XCircle className="w-5 h-5" />}
                value={metrics.totalAbsences}
                title="Faltas registradas"
                subtitle="Ausencias en período"
                badge="0 justif."
                color="rose"
              />

              <MetricCard
                icon={<TrendingUp className="w-5 h-5" />}
                value={`${attendanceRate}%`}
                title="Tasa de cumplimiento"
                subtitle="Meta mensual: 95%"
                badge="Meta 95%"
                color="sky"
              />
            </div>

            <div className="grid grid-cols-12 gap-4 sm:gap-6 mt-4">
              <div className="col-span-12 lg:col-span-6">
                <GeneralSummaryCard
                  selectedProject={project ? { name: project.name } : { name: "Mi Proyecto" }}
                  attendanceRate={attendanceRate}
                  metrics={metrics}
                />
              </div>

              <div className="col-span-12 lg:col-span-6">
                <QuickActions />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
