"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { listJustifications, submitJustification, getMyProjects } from "@/app/services/assistance.service";
import { formatDateTime } from "@/lib/timezone";
import { DateRangeModal } from "@/components/ui/date-range-modal";

import { JustificacionesKPIs } from "./components/JustificacionesKPIs";
import { JustificacionesFilterBar } from "./components/JustificacionesFilterBar";
import { JustificacionesMobileCards } from "./components/JustificacionesMobileCards";
import { JustificacionesDesktopTable } from "./components/JustificacionesDesktopTable";
import { JustificacionesPagination } from "./components/JustificacionesPagination";
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

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link href="/team-member/justificar">
            <button
              type="button"
              className="h-10 px-4 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Nueva justificación</span>
            </button>
          </Link>
          <div className="hidden md:flex items-center">
            <NotificationBell />
          </div>
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
          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className={`h-10 px-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-xs shrink-0 ${
              activePeriod === "custom"
                ? "bg-white dark:bg-[#242938] text-primary border-primary/40 font-bold"
                : "bg-card dark:bg-[#12141F] border-border dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
            title="Seleccionar rango personalizado"
          >
            <CalendarIcon className="w-4 h-4 text-[#8B7BD8]" />
            <span>Rango personalizado</span>
          </button>

          <div className="flex-1 sm:flex-initial px-4 h-10 rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-[#12141F] font-mono text-xs text-muted-foreground dark:text-slate-300 font-medium flex items-center justify-center shadow-xs">
            <span>{dateRange.from} → {dateRange.to}</span>
          </div>
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

      {/* 2. 4 KPI CARDS (OUTSIDE TABLE, AS IN IMAGE 1) */}
      <JustificacionesKPIs
        total={total}
        pendientes={pendientes}
        aprobadas={aprobadas}
        porcentaje={porcentaje}
      />

      {/* 3. UNIFIED CARD CONTAINER: FILTERS + TABLE + PAGINATION */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Filters */}
        <JustificacionesFilterBar
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          projects={projects}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          isLoading={isLoading}
          onRefresh={fetchData}
        />

        {/* Mobile View */}
        <JustificacionesMobileCards
          items={paginatedItems}
          getStatusBadge={getStatusBadge}
          onSubmit={handleSubmit}
          submittingId={submittingId}
          isLoading={isLoading}
        />

        {/* Desktop View */}
        <JustificacionesDesktopTable
          items={paginatedItems}
          getStatusBadge={getStatusBadge}
          onSubmit={handleSubmit}
          submittingId={submittingId}
          isLoading={isLoading}
        />

        {/* Pagination Footer */}
        <JustificacionesPagination
          total={total}
          page={currentPage}
          totalPages={totalPages}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>
    </div>
  );
}
