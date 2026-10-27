"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Clock,
  XCircle,
  TrendingUp,
  AlertTriangle,
  FolderKanban,
  Loader2,
  CheckCircle2,
  Calendar as CalendarIcon,
  Bell,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { getDashboard, getTodayAttendance } from "@/app/services/assistance.service";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { GeneralSummaryCard } from "@/components/dashboard/GeneralSummaryCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { NotificationBell } from "@/components/layout/notification-bell";
import { DateRangeModal } from "@/components/ui/date-range-modal";

type Period = "today" | "thisweek" | "month" | "total" | "custom";

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
  totalAttendances: 2,
  totalAbsences: 2,
  pendingJustifications: 1,
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

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange());
  const [isEntryDone, setIsEntryDone] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const { hydrated, token, user, role, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
  const { project, projects, selectProject, loadingProject, selectedProjectId } = useUserProject();

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || user?.email || "Colaborador";
  const projectName = project?.name || "Sin proyecto asignado";
  const startTime = project?.workStartTime?.slice(0, 5) || "08:00";
  const endTime = project?.workEndTime?.slice(0, 5) || "17:00";

  const totalDays = metrics.totalAttendances + metrics.totalAbsences;
  const attendanceRate =
    totalDays > 0
      ? Math.round((metrics.totalAttendances / totalDays) * 100)
      : 50;

  useEffect(() => {
    if (!hydrated || checkingAuth || !token || !project?.id) return;
    getTodayAttendance(token, project.id).then((att) => {
      if (att?.checkIn && !att?.checkOut) setIsEntryDone(true);
    });
  }, [hydrated, checkingAuth, token, project?.id]);

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
          (!selectedProjectId || selectedProjectId === "all") ? undefined : project?.id
        );
        if (cancelled) return;
        setMetrics({
          totalAttendances: data.totalAttendances ?? 2,
          totalAbsences: data.totalAbsences ?? 2,
          pendingJustifications: data.pendingJustifications ?? 1,
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
    selectedProjectId,
    dateRange.fromDate,
    dateRange.toDate,
  ]);

  if (!hydrated || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const periodOptions: { key: Period; label: string }[] = [
    { key: "today", label: "Hoy" },
    { key: "thisweek", label: "Esta semana" },
    { key: "month", label: "Este mes" },
    { key: "total", label: "Total" },
    { key: "custom", label: "Personalizado" },
  ];

  const handlePeriodSelect = (p: Period) => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (p === "today") {
      const d = formatDate(today);
      setDateRange({ fromDate: d, toDate: d, label: "Hoy", period: p });
    } else if (p === "thisweek") {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      setDateRange({
        fromDate: formatDate(monday),
        toDate: formatDate(today),
        label: "Esta semana",
        period: p,
      });
    } else if (p === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateRange({
        fromDate: formatDate(firstDay),
        toDate: formatDate(today),
        label: "Este mes",
        period: p,
      });
    } else {
      setDateRange({
        fromDate: "2024-01-01",
        toDate: formatDate(today),
        label: "Total",
        period: p,
      });
    }
  };

  return (
    <div className="w-full min-h-screen pb-10">
      <div className="w-full max-w-[1400px] mx-auto px-0 md:px-0 space-y-4 md:space-y-6">
        {/* ================= 1. HEADER (SVG OFFICIAL STRUCTURE) ================= */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-1">
          <div>
            {/* Breadcrumb / Category Tag */}
            <p className="font-mono text-[11px] font-semibold tracking-wider text-violet uppercase mb-1">
              PANEL DE ASISTENCIA <span className="text-text-4 font-normal">· Proyecto {projectName}</span>
            </p>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Hola, {displayName}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-text-4 mt-1">
              Tienes {metrics.pendingJustifications} día pendiente de justificar. Tu turno de hoy empieza a las {startTime}.
            </p>
          </div>

          {/* Action on Header Right: Big CTA Button & Notification Bell */}
          {/* Desktop Right Action */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={() => router.push("/team-member/registrar")}
              className="bg-brand-gradient hover:opacity-95 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{isEntryDone ? "Marcar salida" : "Marcar entrada"}</span>
            </button>
            <NotificationBell />
          </div>
        </div>

        {/* Mobile Full-width CTA Button (Matching dark-dashboard.svg) */}
        <div className="md:hidden w-full">
          <button
            onClick={() => router.push("/team-member/registrar")}
            className="w-full bg-brand-gradient hover:opacity-95 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{isEntryDone ? "Marcar salida" : "Marcar entrada"}</span>
          </button>
        </div>

        {/* ================= 2. PERIOD & CONTROLS BAR ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-raised border border-border/80 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
            {periodOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  if (opt.key === "custom") {
                    setCustomModalOpen(true);
                  } else {
                    handlePeriodSelect(opt.key);
                  }
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                  dateRange.period === opt.key
                    ? "bg-surface text-foreground shadow-sm border border-line-2 font-bold"
                    : "text-text-4 hover:text-foreground hover:bg-surface/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Right: Rango personalizado & Date Badge */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl border border-border/80 bg-raised/80 font-mono text-xs text-text-3 font-semibold flex items-center justify-center shadow-2xs">
              <span>{formatDateDisplay(dateRange.fromDate)} → {formatDateDisplay(dateRange.toDate)}</span>
            </div>
            <button
              type="button"
              onClick={() => setCustomModalOpen(true)}
              className="w-11 h-11 rounded-2xl border border-border/80 bg-raised/80 hover:bg-surface text-text-3 hover:text-primary transition-colors cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
              title="Abrir selector de rango personalizado"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <DateRangeModal
          isOpen={customModalOpen}
          onClose={() => setCustomModalOpen(false)}
          fromDate={dateRange.fromDate}
          toDate={dateRange.toDate}
          onApply={(from, to) => {
            setDateRange({
              fromDate: from,
              toDate: to,
              label: "Personalizado",
              period: "custom" as any,
            });
          }}
        />


        {/* ================= 3. 4 KPI METRIC CARDS ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Presentes */}
          <MetricCard
            icon={<CheckCircle2 className="w-5 h-5 text-green" />}
            topLabel="Presentes"
            topLabelColor="green"
            color="green"
            value={metrics.totalAttendances ?? 2}
            valueSuffix={`de ${totalDays > 0 ? totalDays : 4} días`}
            bottomContent={
              <p className="font-sans text-xs text-muted-foreground truncate">
                Asistencias registradas
              </p>
            }
          />

          {/* Card 2: Por justificar */}
          <MetricCard
            icon={<Clock className="w-5 h-5 text-amber" />}
            topLabel="Por justificar"
            topLabelColor="amber"
            color="amber"
            value={metrics.pendingJustifications ?? 1}
            valueSuffix="pendiente"
            bottomContent={
              <Link
                href="/team-member/justificar"
                className="font-sans text-xs font-semibold text-amber hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Justificar ahora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />

          {/* Card 3: Ausentes */}
          <MetricCard
            icon={<XCircle className="w-5 h-5 text-red" />}
            topLabel="Ausentes"
            topLabelColor="red"
            color="red"
            value={metrics.totalAbsences ?? 2}
            valueSuffix="faltas"
            bottomContent={
              <p className="font-sans text-xs text-muted-foreground truncate">
                1 sin justificación
              </p>
            }
          />

          {/* Card 4: Meta 90% */}
          <MetricCard
            icon={<TrendingUp className="w-5 h-5 text-violet" />}
            topLabel="Meta 90%"
            topLabelColor="violet"
            color="violet"
            value={`${attendanceRate || 50}%`}
            valueSuffix="cumplimiento"
            bottomContent={
              <div className="w-full bg-raised h-1.5 rounded-full overflow-hidden mt-1.5 border border-line">
                <div
                  className="bg-brand-gradient h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, attendanceRate || 50)}%` }}
                />
              </div>
            }
          />
        </div>

        {/* ================= 4. MAIN CONTENT (50/50 COLUMNS) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Left Column (50%): Resumen del periodo (Donut chart & hours) */}
          <div className="w-full h-full flex flex-col">
            <GeneralSummaryCard
              selectedProject={{ name: projectName }}
              attendanceRate={attendanceRate}
              metrics={metrics}
              dateRangeText={`${totalDays > 0 ? totalDays : 5} registros entre el ${formatDateDisplay(dateRange.fromDate)} y el ${formatDateDisplay(dateRange.toDate)}`}
              accumulatedHoursText="16 h 20 m"
            />
          </div>

          {/* Right Column (50%): Acciones rápidas + Últimos registros */}
          <div className="w-full space-y-5 flex flex-col justify-between">
            <QuickActions pendingCount={metrics.pendingJustifications} />
            <RecentActivityCard
              shiftText={`Turno ${startTime} - ${endTime}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
