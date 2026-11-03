"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  TrendingUp,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Pencil,
} from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { listJustifications, submitJustification, getMyProjects } from "@/app/services/assistance.service";
import { formatDateTime } from "@/lib/timezone";
import { DateRangeModal } from "@/components/ui/date-range-modal";

import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationBell } from "@/components/layout/notification-bell";

type DateRange = { from: string; to: string };

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "3months"
  | "6months"
  | "9months"
  | "total"
  | "custom";

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "thisweek", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "3months", label: "3 meses" },
  { id: "6months", label: "6 meses" },
  { id: "9months", label: "9 meses" },
  { id: "total", label: "Total" },
];

export type TMJustificationRow = {
  id: string;
  userId: string;
  userName: string;
  userRoleBadge: string;
  userEmail: string;
  projectName: string;
  motivo: string;
  documentUrl?: string | null;
  fecha: string;
  estado: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "OBSERVATION";
  comment?: string | null;
};


function formatDateDisplay(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

function getStatusBadge(estado: string) {
  switch (estado) {
    case "APPROVED":
      return {
        label: "Aprobada",
        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dot: "bg-emerald-400",
      };
    case "REJECTED":
      return {
        label: "Rechazada",
        cls: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        dot: "bg-rose-400",
      };
    case "OBSERVATION":
      return {
        label: "Observación",
        cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        dot: "bg-amber-400",
      };
    case "PENDING":
      return {
        label: "Borrador",
        cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        dot: "bg-blue-400",
      };
    case "SUBMITTED":
    default:
      return {
        label: "Enviada",
        cls: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        dot: "bg-purple-400",
      };
  }
}

export default function TMJustificacionesPage() {
  const { project: currentProject, projects: userProjects } = useUserProject();
  const { token, user, hydrated, checkingAuth } = useAuthGuard([
    "TEAM_MEMBER",
    "PROJECT_MANAGER",
    "ADMIN",
  ]);

  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: fmt(first), to: fmt(today) };
  });

  const [projectFilter, setProjectFilter] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleProj = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id");
        if (!newId || newId === "all" || newId === "TODOS") {
          setProjectFilter("TODOS");
        } else {
          const matched = userProjects.find((p) => p.id === newId);
          if (matched?.name) {
            setProjectFilter(matched.name);
          }
        }
      };
      window.addEventListener("astc-project-changed", handleProj);
      window.addEventListener("storage", handleProj);
      return () => {
        window.removeEventListener("astc-project-changed", handleProj);
        window.removeEventListener("storage", handleProj);
      };
    }
  }, [userProjects]);

  const [items, setItems] = useState<TMJustificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const calculateDateRange = useCallback((period: Period): DateRange => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    const toStr = fmt(today);

    switch (period) {
      case "today":
        return { from: toStr, to: toStr };
      case "thisweek": {
        const d = new Date(today);
        const dayOfWeek = d.getDay();
        const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        d.setDate(diff);
        return { from: fmt(d), to: toStr };
      }
      case "month": {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: fmt(first), to: toStr };
      }
      case "3months": {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 3);
        return { from: fmt(d), to: toStr };
      }
      case "6months": {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 6);
        return { from: fmt(d), to: toStr };
      }
      case "9months": {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 9);
        return { from: fmt(d), to: toStr };
      }
      case "total":
      default:
        return { from: "01/01/2020", to: toStr };
    }
  }, []);

  useEffect(() => {
    if (activePeriod !== "custom") {
      setDateRange(calculateDateRange(activePeriod));
    }
  }, [activePeriod, calculateDateRange]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await listJustifications(token);
      const rawList = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      console.log("[TM Justificaciones] fetchData received items:", rawList.length);
      if (rawList.length > 0) {
        const mapped: TMJustificationRow[] = rawList.map((item: any, idx: number) => ({
          id: item.id || `just-${idx}`,
          userId: item.userId || user?.id || "",
          userName: item.user?.fullName || item.userName || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user?.username || "Usuario")),
          userRoleBadge: "Trabajador",
          userEmail: item.user?.email || item.userEmail || user?.email || "",
          projectName: item.project?.name || item.projectName || (userProjects?.[0]?.name || "Proyecto Joyit Innovacion 1867"),
          motivo: item.description || item.reason || "Sin motivo especificado",
          documentUrl: item.documentUrl || null,
          fecha: formatDateTime(item.absenceDate || item.submittedAt || item.date || item.createdAt || new Date()),
          estado: (item.status as any) || "SUBMITTED",
          comment: item.comment || null,
        }));
        setItems(mapped);
      } else {
        setItems([]);
      }
    } catch {
        setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated || checkingAuth) return;
    if (token) fetchData();
    else setIsLoading(false);
  }, [hydrated, checkingAuth, token, fetchData]);

  const handleSubmit = async (id: string) => {
    if (!token) return;
    setSubmittingId(id);
    try {
      await submitJustification(token, id);
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, estado: "SUBMITTED" } : it))
      );
    } catch {
      // fallback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, estado: "SUBMITTED" } : it))
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const projects = useMemo(() => {
    const list = userProjects && userProjects.length > 0 ? userProjects : [];
    const fromItems = items.map((it) => it.projectName).filter(Boolean);
    const combined = Array.from(new Set([...list.map((p) => p.name), ...fromItems]));
    return [
      { id: "TODOS", name: "Todos los proyectos" },
      ...combined.map((name) => ({ id: name, name })),
    ];
  }, [userProjects, items]);

  const filteredItems = useMemo(() => {
    return items.filter((row) => {
      if (projectFilter !== "TODOS" && row.projectName && row.projectName !== projectFilter) {
        return false;
      }
      if (statusFilter !== "TODOS" && row.estado !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchMotivo = row.motivo.toLowerCase().includes(q);
        const matchUser = row.userName.toLowerCase().includes(q);
        const matchEmail = row.userEmail.toLowerCase().includes(q);
        if (!matchMotivo && !matchUser && !matchEmail) return false;
      }
      return true;
    });
  }, [items, projectFilter, statusFilter, search]);

  const total = filteredItems.length;
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [projectFilter, statusFilter, search, activePeriod]);

  const pendientes = filteredItems.filter(
    (i) => i.estado === "PENDING" || i.estado === "SUBMITTED"
  ).length;
  const aprobadas = filteredItems.filter((i) => i.estado === "APPROVED").length;
  const porcentaje = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

  if (!hydrated || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-12 space-y-4 md:space-y-6">
      {/* HEADER SECTION (EXACT DESIGN IMAGE 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs mb-1">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-[#8B5CF6] uppercase">COLABORADOR</span>
            <span className="text-muted-foreground font-light text-[16px] leading-[24px] font-['Navigo',sans-serif]">· Panel de asistencia</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Mis justificaciones
          </h1>
          <p className="text-xs sm:text-sm text-text-4 mt-1">
            Gestión y seguimiento de tus solicitudes de justificación y documentos adjuntos.
          </p>
        </div>

        <div className="flex items-center">
          <NotificationBell />
        </div>
      </div>

      {/* 1. PERIOD SELECTOR BAR (EXACT SVG DESIGN) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-0.5 bg-card dark:bg-[#12141F] border border-border dark:border-white/10 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-xs">
          {PERIOD_TABS.map((tab) => {
            const isActive = activePeriod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePeriod(tab.id)}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer text-center ${
                  isActive
                    ? "bg-white dark:bg-[#242938] text-foreground dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10 font-bold"
                    : "text-muted-foreground hover:text-foreground font-medium hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial px-4 h-10 rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-[#12141F] font-mono text-xs text-muted-foreground dark:text-slate-300 font-medium flex items-center justify-center shadow-xs">
            <span>{formatDateDisplay(dateRange.from)} → {formatDateDisplay(dateRange.to)}</span>
          </div>

          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className={`w-10 h-10 rounded-2xl border transition-all cursor-pointer flex items-center justify-center text-xs font-semibold shadow-xs shrink-0 ${
              activePeriod === "custom"
                ? "bg-white dark:bg-[#242938] text-primary border-primary/40 font-bold"
                : "bg-card dark:bg-[#12141F] border-border dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
            title="Seleccionar rango personalizado"
          >
            <CalendarIcon className="w-4 h-4 text-[#8B7BD8]" />
          </button>
        </div>
      </div>

      <DateRangeModal
        isOpen={dateRangeModalOpen}
        onClose={() => setDateRangeModalOpen(false)}
        fromDate={dateRange.from}
        toDate={dateRange.to}
        onApply={(from, to) => {
          setDateRange({ from, to });
          setActivePeriod("custom");
        }}
      />

      {/* UNIFIED MAIN CONTAINER ("Un cuadro entero, no 3") */}
      <div className="rounded-[22px] border border-border bg-card/60 dark:bg-[#0C0E18] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 sm:space-y-6">
        {/* ================= 4 KPI METRIC CARDS ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SubMetricCard
            label="Total"
            value={total}
            icon={<FileText className="w-5 h-5 text-text-3" />}
          />
          <SubMetricCard
            label="Pendientes"
            value={pendientes}
            color="amber"
            icon={<Clock className="w-5 h-5" />}
          />
          <SubMetricCard
            label="Aprobadas"
            value={aprobadas}
            color="green"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <SubMetricCard
            label="% Aprobadas"
            value={`${porcentaje}%`}
            color="blue"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Divider Line */}
        <div className="border-t border-border/60 -mx-4 sm:-mx-5 md:-mx-6" />

        {/* Table & Filters Content */}
        <div className="space-y-4 sm:space-y-5 pt-1">
          {/* Filter controls row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-3 sm:gap-4">
            {/* Search motivo */}
            <div className="flex-1 max-w-xl space-y-1.5">
              <label className="text-xs font-semibold text-text-3 block">
                Buscar motivo
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Ej: Médico, Personal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 text-xs rounded-xl border border-border/80 bg-white dark:bg-card text-foreground"
                />
              </div>
            </div>

            {/* Status filter & update button */}
            <div className="flex items-end gap-2.5 min-w-[240px]">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-text-3 block">
                  Filtrar estado
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 text-xs rounded-xl border border-border/80 bg-white dark:bg-card text-foreground w-full">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los estados</SelectItem>
                    <SelectItem value="APPROVED">Aprobadas</SelectItem>
                    <SelectItem value="SUBMITTED">Pendientes</SelectItem>
                    <SelectItem value="OBSERVATION">Observadas</SelectItem>
                    <SelectItem value="REJECTED">Rechazadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={() => {
                  fetchData();
                  setPage(1);
                  setSearch("");
                  setStatusFilter("TODOS");
                }}
                className="w-11 h-11 rounded-xl border border-border/80 bg-white dark:bg-card hover:bg-gray-100 dark:hover:bg-raised text-text-3 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Restablecer filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Table (Identical to asistencias & faltas) */}
          <div className="hidden md:block overflow-x-auto border border-border/60 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-raised/60 border-b border-border/60 text-muted-foreground font-mono text-[10.5px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">FECHA</th>
                  <th className="py-3 px-4 font-semibold">MOTIVO</th>
                  <th className="py-3 px-4 font-semibold">DOCUMENTO</th>
                  <th className="py-3 px-4 font-semibold">OBSERVACIÓN</th>
                  <th className="py-3 px-4 font-semibold">ESTADO</th>
                  <th className="py-3 px-4 font-semibold text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Cargando justificaciones...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No se encontraron justificaciones en el periodo seleccionado
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((row, idx) => {
                    const isEven = idx % 2 === 0;
                    const badge = getStatusBadge(row.estado);
                    const isObservation = row.estado === "OBSERVATION";
                    return (
                      <tr
                        key={row.id || idx}
                        className={`hover:bg-raised/40 transition-colors ${
                          isEven ? "bg-surface/30" : "bg-transparent"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-medium text-foreground whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-text-4" />
                            <span>{row.fecha}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-foreground max-w-[200px] truncate" title={row.motivo}>
                          {row.motivo}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.documentUrl ? (
                            <a
                              href={row.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/80 bg-surface hover:bg-raised text-[11px] font-medium text-primary hover:text-primary/90 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ver adjunto</span>
                            </a>
                          ) : (
                            <span className="text-text-4 text-xs font-mono">Sin documento</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground max-w-[180px] truncate" title={row.comment || "—"}>
                          {row.comment || "—"}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.cls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/team-member/justificaciones/${row.id}`}>
                              <button
                                type="button"
                                title="Ver detalle"
                                className="w-8 h-8 rounded-xl border border-border/80 bg-white dark:bg-card hover:bg-gray-100 dark:hover:bg-raised text-text-3 hover:text-foreground flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                            {isObservation && (
                              <Link href={`/team-member/justificar?justificationId=${row.id}`}>
                                <button
                                  type="button"
                                  title="Subsanar"
                                  className="w-8 h-8 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards List (Identical to asistencias & faltas) */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Cargando justificaciones...</span>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No se encontraron justificaciones en el periodo seleccionado
              </div>
            ) : (
              paginatedItems.map((row, idx) => {
                const badge = getStatusBadge(row.estado);
                const isObservation = row.estado === "OBSERVATION";
                return (
                  <div
                    key={row.id || idx}
                    className="rounded-2xl border border-border/70 bg-surface/50 p-4 space-y-3"
                  >
                    {/* Header row: Fecha & Estado badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground">
                        <CalendarIcon className="w-4 h-4 text-text-4" />
                        <span>{row.fecha}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.cls}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Motivo box */}
                    <div className="bg-raised/70 border border-border/60 rounded-xl p-2.5 space-y-1">
                      <span className="block font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
                        MOTIVO
                      </span>
                      <p className="text-xs font-medium text-foreground">{row.motivo}</p>
                    </div>

                    {/* Observación box if any */}
                    {row.comment && (
                      <div className="bg-raised/70 border border-border/60 rounded-xl p-2.5 space-y-1">
                        <span className="block font-mono text-[9.5px] uppercase tracking-wider text-amber-400 font-semibold">
                          OBSERVACIÓN
                        </span>
                        <p className="text-xs text-muted-foreground">{row.comment}</p>
                      </div>
                    )}

                    {/* Actions row: Documento link & Details button */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      {row.documentUrl ? (
                        <a
                          href={row.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/80 bg-raised hover:bg-surface text-xs font-medium text-primary transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver adjunto</span>
                        </a>
                      ) : (
                        <span className="text-xs text-text-4 font-mono">Sin adjunto</span>
                      )}

                      <div className="flex items-center gap-2">
                        <Link href={`/team-member/justificaciones/${row.id}`}>
                          <button
                            type="button"
                            title="Ver detalle"
                            className="w-8 h-8 rounded-xl border border-border/80 bg-white dark:bg-card hover:bg-gray-100 dark:hover:bg-raised text-text-3 hover:text-foreground flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        {isObservation && (
                          <Link href={`/team-member/justificar?justificationId=${row.id}`}>
                            <button
                              type="button"
                              title="Subsanar"
                              className="w-8 h-8 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {/* Desktop/Tablet: Centered matching Image 1 */}
          <div className="hidden sm:flex items-center justify-center gap-3 pt-3 border-t border-border/60">
            <span className="text-xs text-text-3 font-medium whitespace-nowrap">
              Página <strong className="text-foreground">{currentPage}</strong> de {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-xl border border-border/80 bg-surface hover:bg-raised flex items-center justify-center text-text-3 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-xl border border-border/80 bg-surface hover:bg-raised flex items-center justify-center text-text-3 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-text-4 font-mono whitespace-nowrap">
              {total} {total === 1 ? "registro total" : "registros totales"}
            </span>
          </div>

          {/* Mobile: Single row matching Image 3 */}
          <div className="flex sm:hidden items-center justify-between w-full pt-3 border-t border-border/60">
            <span className="text-xs text-text-4 font-mono">
              {total} {total === 1 ? "registro total" : "registros totales"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-xl border border-border/80 bg-surface hover:bg-raised flex items-center justify-center text-text-3 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-text-3 font-medium whitespace-nowrap">
                Página <strong className="text-foreground">{currentPage}</strong> de {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-xl border border-border/80 bg-surface hover:bg-raised flex items-center justify-center text-text-3 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
