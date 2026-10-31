"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  XCircle,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Calendar as CalendarIcon,
  ArrowRight,
} from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { getDashboard, getTodayAttendance, listAttendance } from "@/app/services/assistance.service";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { GeneralSummaryCard } from "@/components/dashboard/GeneralSummaryCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivityCard, type AttendanceRecordSummary } from "@/components/dashboard/RecentActivityCard";
import { NotificationBell } from "@/components/layout/notification-bell";
import { DateRangeModal } from "@/components/ui/date-range-modal";

type Period = "today" | "thisweek" | "month" | "3months" | "6months" | "9months" | "total" | "custom";

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

const WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

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

function parseMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function formatDayName(isoDate?: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${WEEKDAYS[d.getDay()]} ${parts[2]}/${parts[1]}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange());
  const [isEntryDone, setIsEntryDone] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecordSummary[]>([]);
  const [accumulatedHoursText, setAccumulatedHoursText] = useState<string>("0 h 00 m");

  const { hydrated, token, user, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
  const { project, selectedProjectId } = useUserProject();

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || user?.email || "Colaborador";
  const projectName = project?.name || "Sin proyecto asignado";
  const startTime = project?.workStartTime?.slice(0, 5) || "08:00";
  const endTime = project?.workEndTime?.slice(0, 5) || "17:00";

  const totalDays = metrics.totalAttendances + metrics.totalAbsences + metrics.pendingJustifications;
  const attendanceRate =
    totalDays > 0
      ? Math.round((metrics.totalAttendances / totalDays) * 100)
      : 0;

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
        const targetProjectId = (!selectedProjectId || selectedProjectId === "all") ? undefined : project?.id;
        const [data, attRes] = await Promise.all([
          getDashboard(
            token,
            dateRange.fromDate,
            dateRange.toDate,
            targetProjectId
          ).catch(() => null),
          listAttendance(token, {
            page: 0,
            size: 100,
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
            projectId: targetProjectId,
          }).catch(() => null),
        ]);
        if (cancelled) return;
        setMetrics({
          totalAttendances: data?.totalAttendances ?? 0,
          totalAbsences: data?.totalAbsences ?? 0,
          pendingJustifications: data?.pendingJustifications ?? 0,
        });

        const items = Array.isArray(attRes?.items) ? attRes.items : [];
        let totalMins = 0;
        for (const item of items) {
          const inM = parseMinutes(item.checkIn);
          const outM = parseMinutes(item.checkOut);
          if (inM !== null && outM !== null) {
            let diff = outM - inM;
            if (diff < 0) diff += 24 * 60;
            totalMins += diff;
          }
        }
        setAccumulatedHoursText(
          `${Math.floor(totalMins / 60)} h ${String(totalMins % 60).padStart(2, "0")} m`
        );

        const mappedRecent: AttendanceRecordSummary[] = items.slice(0, 3).map((item: any) => {
          const statusUpper = String(item.status || "").toUpperCase();
          const hasCheckOut = Boolean(item.checkOut);
          const status: "Presente" | "Pendiente" | "Falta" =
            statusUpper.includes("ABSENT") || statusUpper.includes("FALTA")
              ? "Falta"
              : !hasCheckOut
              ? "Pendiente"
              : "Presente";

          const inM = parseMinutes(item.checkIn);
          const outM = parseMinutes(item.checkOut);
          let durationText = "—";
          if (inM !== null && outM !== null) {
            let diff = outM - inM;
            if (diff < 0) diff += 24 * 60;
            durationText = `${Math.floor(diff / 60)} h ${String(diff % 60).padStart(2, "0")} m`;
          }

          const inShort = item.checkIn ? String(item.checkIn).slice(0, 5) : "";
          const outShort = item.checkOut ? String(item.checkOut).slice(0, 5) : "";
          const timesText = hasCheckOut
            ? `Entrada ${inShort} · Salida ${outShort}`
            : inShort
            ? `Entrada ${inShort}`
            : "Sin marcaje registrado";

          return {
            dayName: formatDayName(item.date),
            timesText,
            durationText,
            status,
          };
        });
        setRecentRecords(mappedRecent);
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
    project?.id,
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
    { key: "3months", label: "3 meses" },
    { key: "6months", label: "6 meses" },
    { key: "9months", label: "9 meses" },
    { key: "total", label: "Total" },
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
    } else if (p === "3months") {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      setDateRange({
        fromDate: formatDate(from),
        toDate: formatDate(today),
        label: "3 meses",
        period: p,
      });
    } else if (p === "6months") {
      const from = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      setDateRange({
        fromDate: formatDate(from),
        toDate: formatDate(today),
        label: "6 meses",
        period: p,
      });
    } else if (p === "9months") {
      const from = new Date(today.getFullYear(), today.getMonth() - 8, 1);
      setDateRange({
        fromDate: formatDate(from),
        toDate: formatDate(today),
        label: "9 meses",
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
            <p className="flex items-center gap-1.5 text-xs mb-1">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-violet uppercase">COLABORADOR</span>
              <span className="text-muted-foreground font-light text-[16px] leading-[24px] font-['Navigo',sans-serif]">· Panel de asistencia</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-0.5 bg-card dark:bg-[#12141F] border border-border dark:border-white/10 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-xs">
            {periodOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handlePeriodSelect(opt.key)}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap text-center ${
                  dateRange.period === opt.key
                    ? "bg-white dark:bg-[#242938] text-foreground dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10 font-bold"
                    : "text-muted-foreground hover:text-foreground font-medium hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCustomModalOpen(true)}
              className={`h-10 px-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-xs shrink-0 ${
                dateRange.period === "custom"
                  ? "bg-white dark:bg-[#242938] text-primary border-primary/40 font-bold"
                  : "bg-card dark:bg-[#12141F] border-border dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
              title="Abrir selector de rango personalizado"
            >
              <CalendarIcon className="w-4 h-4 text-[#8B7BD8]" />
              <span>Rango personalizado</span>
            </button>

            <div className="flex-1 sm:flex-initial px-4 h-10 rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-[#12141F] font-mono text-xs text-muted-foreground dark:text-slate-300 font-medium flex items-center justify-center shadow-xs">
              <span>{formatDateDisplay(dateRange.fromDate)} → {formatDateDisplay(dateRange.toDate)}</span>
            </div>
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


        {/* ================= 3. 4 KPI METRIC CARDS (EXACT IMAGE 2) ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Días presentes */}
          <MetricCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            topLabel="Días presentes"
            topLabelColor="green"
            color="green"
            value={metrics.totalAttendances ?? 0}
            valueSuffix={`de ${totalDays} días`}
            bottomContent={
              <p className="font-sans text-xs text-muted-foreground truncate">
                Asistencias registradas
              </p>
            }
          />

          {/* Card 2: Requiere acción */}
          <MetricCard
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            topLabel="Requiere acción"
            topLabelColor="amber"
            color="amber"
            value={metrics.pendingJustifications ?? 0}
            valueSuffix="por justificar"
            bottomContent={
              <Link
                href="/team-member/justificar"
                className="font-sans text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Justificar ahora →</span>
              </Link>
            }
          />

          {/* Card 3: Días ausentes */}
          <MetricCard
            icon={<XCircle className="w-5 h-5 text-rose-400" />}
            topLabel="Días ausentes"
            topLabelColor="red"
            color="red"
            value={metrics.totalAbsences ?? 0}
            valueSuffix="faltas"
            bottomContent={
              <p className="font-sans text-xs text-muted-foreground truncate">
                {metrics.pendingJustifications > 0 ? `${metrics.pendingJustifications} sin justificación` : "1 sin justificación"}
              </p>
            }
          />

          {/* Card 4: Meta 90% */}
          <MetricCard
            icon={<TrendingUp className="w-5 h-5 text-[#C084FC]" />}
            topLabel="Meta 90%"
            topLabelColor="violet"
            color="violet"
            value={`${attendanceRate}%`}
            valueSuffix="cumplimiento"
            bottomContent={
              <div className="w-full bg-slate-200/50 dark:bg-white/10 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-gradient-to-r from-[#A855F7] via-[#818CF8] to-[#38BDF8] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, attendanceRate)}%` }}
                />
              </div>
            }
          />
        </div>

        {/* ================= 4. MAIN CONTENT (50/50 COLUMNS EXACT SVG) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Left Column (50%): Resumen del periodo (Donut chart & hours) */}
          <div className="w-full flex flex-col">
            <GeneralSummaryCard
              selectedProject={{ name: projectName }}
              attendanceRate={attendanceRate}
              metrics={metrics}
              dateRangeText={`${totalDays} registros entre el ${formatDateDisplay(dateRange.fromDate)} y el ${formatDateDisplay(dateRange.toDate)}`}
              accumulatedHoursText={accumulatedHoursText}
            />
          </div>

          {/* Right Column (50%): Acciones rápidas */}
          <div className="w-full flex flex-col">
            <QuickActions pendingCount={metrics.pendingJustifications} />
          </div>
        </div>

        {/* ================= 5. ÚLTIMOS REGISTROS (FULL WIDTH AS IN SVG) ================= */}
        <div className="w-full">
          <RecentActivityCard
            shiftText={`Turno ${startTime} - ${endTime}`}
            records={recentRecords}
          />
        </div>
      </div>
    </div>
  );
}
