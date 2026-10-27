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
  const [isLoading, setIsLoading] = useState(false);
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
    fetchData();
  }, [fetchData]);

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
      if (projectFilter !== "TODOS" && row.projectName !== projectFilter) {
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
    <div className="space-y-5 sm:space-y-6">
      {/* 0. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] bg-primary/10 text-primary border border-primary/20 dark:bg-violet/10 dark:text-[#7c9aff] dark:border-violet/20 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            MÓDULO DE JUSTIFICACIONES
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Mis justificaciones
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro, control y seguimiento de ausencias, tardanzas y permisos solicitados.
          </p>
        </div>

        <Link href="/team-member/justificar" className="self-start sm:self-auto">
          <button
            type="button"
            className="h-10 px-4 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            <span>Nueva justificación</span>
          </button>
        </Link>
      </div>

      {/* 1. PERIOD SELECTOR TABS (Desktop only) */}
      <div className="hidden md:flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-card border border-border">
          {PERIOD_TABS.map((tab) => {
            const isActive = activePeriod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePeriod(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-accent text-foreground border border-border font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setDateRangeModalOpen(true)}
          className="h-10 px-4 rounded-2xl bg-card border border-border text-xs font-medium text-foreground hover:text-primary hover:text-foreground flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
          title="Seleccionar rango personalizado"
        >
          <CalendarIcon className="w-4 h-4 text-[#A855F7]" />
          <span>Rango personalizado</span>
        </button>

        <div className="h-10 px-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 flex items-center gap-2 text-xs font-mono shrink-0 shadow-xs">
          <span className="text-muted-foreground">Período:</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {dateRange.from} → {dateRange.to}
          </span>
        </div>
      </div>

      {/* 2. PERIOD SELECTOR TABS (Mobile only) */}
      <div className="md:hidden space-y-2.5">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-card dark:bg-[#0C0E18] border border-border dark:border-[#1E2335]">
          <div className="grid grid-cols-4 gap-1 text-center">
            {PERIOD_TABS.slice(0, 4).map((tab) => {
              const isActive = activePeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePeriod(tab.id)}
                  className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-white dark:bg-accent text-foreground border border-border font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-1 text-center mt-1.5 max-w-[280px]">
            {PERIOD_TABS.slice(4).map((tab) => {
              const isActive = activePeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePeriod(tab.id)}
                  className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-white dark:bg-accent text-foreground border border-border font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. DATE RANGE SELECTOR BAR (Mobile only) */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-11 px-3.5 rounded-2xl bg-card dark:bg-[#0C0E18] border border-border dark:border-[#1E2335] flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
            <CalendarIcon className="w-3.5 h-3.5 text-[#A855F7]" />
            <span className="text-foreground font-semibold">{dateRange.from} → {dateRange.to}</span>
          </div>
          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className="w-11 h-11 rounded-2xl bg-card border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Seleccionar rango"
          >
            <CalendarIcon className="w-4 h-4" />
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

      {/* UNIFIED MAIN CONTAINER */}
      <div className="rounded-[22px] border border-border bg-card/60 dark:bg-[#0C0E18] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 sm:space-y-6">
        {/* 4. 4 KPI CARDS */}
        <JustificacionesKPIs
          total={total}
          pendientes={pendientes}
          aprobadas={aprobadas}
          porcentaje={porcentaje}
        />

        {/* Divider Line */}
        <div className="border-t border-border/60 -mx-4 sm:-mx-5 md:-mx-6" />

        {/* 5. FILTERS CONTAINER */}
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

        {/* 6. MOBILE CARDS VIEW */}
        <JustificacionesMobileCards
          items={filteredItems}
          getStatusBadge={getStatusBadge}
          onSubmit={handleSubmit}
          submittingId={submittingId}
          isLoading={isLoading}
        />

        {/* 7. DESKTOP TABLE VIEW */}
        <JustificacionesDesktopTable
          items={filteredItems}
          getStatusBadge={getStatusBadge}
          onSubmit={handleSubmit}
          submittingId={submittingId}
          isLoading={isLoading}
        />

        {/* 8. PAGINATION FOOTER */}
        <JustificacionesPagination
          total={total}
          page={page}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          onNextPage={() => {}}
        />
      </div>
    </div>
  );
}
