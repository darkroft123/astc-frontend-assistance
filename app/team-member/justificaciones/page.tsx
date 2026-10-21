"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  FileText,
  Calendar as CalendarIcon,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Send,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Folder,
} from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { listJustifications, submitJustification } from "@/app/services/assistance.service";
import { formatDateTime } from "@/lib/timezone";
import { DateRangeModal, DateRange } from "@/components/ui/date-range-modal";

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
  userRoleBadge?: string;
  userEmail: string;
  projectName?: string;
  motivo: string;
  documentUrl?: string | null;
  fecha: string;
  estado: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "OBSERVATION";
  comment?: string | null;
};

const DEFAULT_TM_JUSTIFICATIONS: TMJustificationRow[] = [
  {
    id: "just-001",
    userId: "usr-carlos",
    userName: "carlos mamani",
    userRoleBadge: "Trabajador",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    projectName: "testo6",
    motivo: "Cita médica programada en el hospital central con constancia adjunta.",
    documentUrl: "https://example.com/comprobante_medico.pdf",
    fecha: "02/09/2026",
    estado: "SUBMITTED",
    comment: null,
  },
  {
    id: "just-002",
    userId: "usr-carlos",
    userName: "carlos mamani",
    userRoleBadge: "Trabajador",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    projectName: "testo6",
    motivo: "Trámite personal documentario en notaría pública.",
    documentUrl: "https://example.com/constancia_notarial.pdf",
    fecha: "28/08/2026",
    estado: "APPROVED",
    comment: "Aprobada por el Jefe de Proyecto.",
  },
  {
    id: "just-003",
    userId: "usr-carlos",
    userName: "carlos mamani",
    userRoleBadge: "Trabajador",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    projectName: "gestion de asistencia",
    motivo: "Emergencia odontológica de urgencia sin aviso previo.",
    documentUrl: null,
    fecha: "15/08/2026",
    estado: "OBSERVATION",
    comment: "Favor de adjuntar la constancia de atención médica para proceder con la aprobación.",
  },
  {
    id: "just-004",
    userId: "usr-carlos",
    userName: "carlos mamani",
    userRoleBadge: "Trabajador",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    projectName: "proyecto testeo",
    motivo: "Inasistencia por contingencia imprevista en el transporte público.",
    documentUrl: null,
    fecha: "10/08/2026",
    estado: "REJECTED",
    comment: "No cumple con el plazo reglamentario de 48 horas.",
  },
];

export default function JustificationsPage() {
  const router = useRouter();
  const { hydrated, token, user } = useAuthGuard(["TEAM_MEMBER"]);

  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: "01/09/2026",
    to: "03/09/2026",
  });

  const [data, setData] = useState<{ items: TMJustificationRow[]; total: number }>({
    items: DEFAULT_TM_JUSTIFICATIONS,
    total: DEFAULT_TM_JUSTIFICATIONS.length,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const size = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [projectFilter, setProjectFilter] = useState("all");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const projects = [
    { id: "all", name: "Todos los proyectos (3)" },
    { id: "p1", name: "gestion de asistencia" },
    { id: "p2", name: "proyecto testeo" },
    { id: "p3", name: "testo6" },
  ];

  const userKey = user?.username || user?.id || "usr-carlos";
  const userFullName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "carlos mamani";
  const userEmail = user?.email || "mamanigutierrezcarlos123@gmail.com";
  const fromDate = dateRange.from;
  const toDate = dateRange.to;

  const fetchData = useCallback(async () => {
    if (!token) {
      setData({ items: DEFAULT_TM_JUSTIFICATIONS, total: DEFAULT_TM_JUSTIFICATIONS.length });
      return;
    }
    setIsLoading(true);
    try {
      const res = await listJustifications(token, {
        page: page - 1,
        size,
        status: statusFilter === "TODOS" ? null : statusFilter,
        fromDate,
        toDate,
      });

      const fetched = res?.items ?? [];
      if (fetched.length > 0) {
        setData({
          items: fetched.map((i: any) => ({
            id: i.id,
            userId: i.userId || userKey,
            userName: userFullName,
            userRoleBadge: "Trabajador",
            userEmail: userEmail,
            projectName: i.projectName || "testo6",
            motivo: i.description || "Sin motivo",
            documentUrl: i.documentUrl || null,
            fecha: i.absenceDate
              ? new Date(i.absenceDate + "T12:00:00Z").toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
              : "02/09/2026",
            estado: i.status || "SUBMITTED",
            comment: i.comment || null,
          })),
          total: res?.total ?? fetched.length,
        });
      } else {
        setData({ items: DEFAULT_TM_JUSTIFICATIONS, total: DEFAULT_TM_JUSTIFICATIONS.length });
      }
    } catch {
      setData({ items: DEFAULT_TM_JUSTIFICATIONS, total: DEFAULT_TM_JUSTIFICATIONS.length });
    } finally {
      setIsLoading(false);
    }
  }, [token, page, statusFilter, fromDate, toDate, userKey, userFullName, userEmail]);

  useEffect(() => {
    if (hydrated) {
      fetchData();
    }
  }, [hydrated, fetchData]);

  const handleSubmit = useCallback(
    async (id: string) => {
      if (!token || submittingId) return;
      if (!confirm("¿Enviar esta justificación para revisión del Jefe de Proyecto?")) return;
      try {
        setSubmittingId(id);
        await submitJustification(token, id);
        fetchData();
      } catch (err) {
        console.error("Error submitting justification:", err);
        alert("Error al enviar la justificación");
      } finally {
        setSubmittingId(null);
      }
    },
    [token, submittingId, fetchData]
  );

  const filteredItems = useMemo(() => {
    return data.items.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.motivo.toLowerCase().includes(search.toLowerCase()) ||
        item.userName.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "TODOS" ||
        item.estado === statusFilter ||
        (statusFilter === "PENDING" && (item.estado === "PENDING" || item.estado === "SUBMITTED"));
      const matchProject =
        projectFilter === "all" ||
        item.projectName?.toLowerCase() === projectFilter.toLowerCase();
      return matchSearch && matchStatus && matchProject;
    });
  }, [data.items, search, statusFilter, projectFilter]);

  const total = data.total || data.items.length;
  const pendientes = data.items.filter(
    (i) => i.estado === "SUBMITTED" || i.estado === "PENDING"
  ).length;
  const aprobadas = data.items.filter((i) => i.estado === "APPROVED").length;
  const porcentaje = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

  const getStatusBadge = (st: string) => {
    switch (st) {
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
          label: "Observada",
          cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          dot: "bg-amber-400",
        };
      case "SUBMITTED":
      default:
        return {
          label: "Enviada",
          cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          dot: "bg-blue-400",
        };
    }
  };

  return (
    <div className="w-full space-y-6 text-foreground font-sans bg-transparent pb-12 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-purple-400">
              PANEL DE ASISTENCIA
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              · Solicitudes del trabajador
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Mis justificaciones
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Revisión, estado y gestión de tus solicitudes de justificación y comprobantes.
          </p>
        </div>

        <Link
          href="/team-member/justificar"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer self-start md:self-auto"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Nueva justificación</span>
        </Link>
      </div>

      {/* 2. PERIOD SELECTOR - Desktop View */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#0C0E18] border border-[#1E2335]">
          {PERIOD_TABS.map((tab) => {
            const isActive = activePeriod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePeriod(tab.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#1E2338] text-white border border-[#2D354E] font-semibold shadow-xs"
                    : "text-[#8F96AE] hover:text-white"
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
          className="h-10 px-4 rounded-2xl bg-[#0C0E18] border border-[#1E2335] text-xs font-medium text-[#8F96AE] hover:text-white flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
          title="Seleccionar rango personalizado"
        >
          <CalendarIcon className="w-4 h-4 text-[#A855F7]" />
          <span>Rango personalizado</span>
        </button>

        <div className="h-10 px-4 rounded-2xl bg-[#0C0E18] border border-[#1E2335] flex items-center gap-2 text-xs font-mono shrink-0 shadow-xs">
          <span className="text-[#8F96AE]">Período:</span>
          <span className="text-[#EEF0F6] font-semibold">
            {dateRange.from} → {dateRange.to}
          </span>
        </div>
      </div>

      {/* 2. PERIOD SELECTOR TABS (Mobile only - 2 rows matching Figma SVG) */}
      <div className="md:hidden space-y-2.5">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-[#0C0E18] border border-[#1E2335]">
          {/* Row 1: 4 tabs */}
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
                      ? "bg-[#1E2338] text-white border border-[#2D354E] font-semibold shadow-xs"
                      : "text-[#8F96AE] hover:text-white font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Row 2: 3 tabs */}
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
                      ? "bg-[#1E2338] text-white border border-[#2D354E] font-semibold shadow-xs"
                      : "text-[#8F96AE] hover:text-white font-medium"
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
          <div className="flex-1 h-11 px-3.5 rounded-2xl bg-[#0C0E18] border border-[#1E2335] flex items-center justify-center gap-2 text-xs font-mono text-[#8F96AE]">
            <CalendarIcon className="w-3.5 h-3.5 text-[#A855F7]" />
            <span className="text-[#EEF0F6] font-semibold">{dateRange.from} → {dateRange.to}</span>
          </div>
          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className="w-11 h-11 rounded-2xl bg-[#0C0E18] border border-[#1E2335] text-[#8F96AE] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
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

      {/* 4. 4 KPI CARDS (Matching PM Design System) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* Card 1: Total solicitudes */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Total solicitudes</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{total}</p>
          </div>
        </div>

        {/* Card 2: Pendientes */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs text-amber-400 font-medium">Pendientes</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{pendientes}</p>
          </div>
        </div>

        {/* Card 3: Aprobadas */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-emerald-400 font-medium">Aprobadas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{aprobadas}</p>
          </div>
        </div>

        {/* Card 4: % Aprobadas */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs text-purple-400 font-medium">% Aprobadas</p>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{porcentaje}%</p>
          </div>
        </div>
      </div>

      {/* 5. FILTERS CONTAINER - Desktop & Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-end rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Buscar motivo */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Buscar motivo
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: Cita médica, Notaría..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Estado
          </label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="TODOS" className="bg-card text-foreground">Todos los estados</option>
              <option value="SUBMITTED" className="bg-card text-foreground">Enviada</option>
              <option value="APPROVED" className="bg-card text-foreground">Aprobada</option>
              <option value="OBSERVATION" className="bg-card text-foreground">Observación</option>
              <option value="REJECTED" className="bg-card text-foreground">Rechazada</option>
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Action: Actualizar button */}
        <div>
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="w-full h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-xs font-medium text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* 6. MOBILE CARDS VIEW (Matching dark-justificacionjes.svg) */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs rounded-2xl border border-border bg-card/60">
            No se encontraron justificaciones.
          </div>
        ) : (
          filteredItems.map((row) => {
            const badge = getStatusBadge(row.estado);
            const isObservation = row.estado === "OBSERVATION";
            const isPending = row.estado === "PENDING" || row.estado === "SUBMITTED";

            return (
              <div
                key={row.id}
                className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 space-y-3 shadow-sm"
              >
                {/* Header: User Avatar + Name + Status Pill */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                      CM
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs truncate">
                        {row.userName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {row.userEmail}
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                </div>

                {/* Motivo Card Box */}
                <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                    MOTIVO
                  </span>
                  <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                    {row.motivo}
                  </p>
                  {row.comment && (
                    <p className="text-[11px] text-amber-400/90 italic mt-1.5 pt-1.5 border-t border-border/40">
                      Nota: {row.comment}
                    </p>
                  )}
                </div>

                {/* 2-box row: Documento & Fecha */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                      DOCUMENTO
                    </span>
                    {row.documentUrl ? (
                      <a
                        href={row.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-purple-400 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver adjunto
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin documento</span>
                    )}
                  </div>
                  <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                      FECHA
                    </span>
                    <span className="text-xs font-mono font-medium text-foreground">{row.fecha}</span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/team-member/justificaciones/${row.id}`} className="flex-1">
                    <button
                      type="button"
                      className="w-full h-11 rounded-xl border border-border bg-background/50 hover:bg-background text-sm font-medium text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span>Ver</span>
                    </button>
                  </Link>

                  {isObservation && (
                    <Link href={`/team-member/justificar?justificationId=${row.id}`} className="flex-1">
                      <button
                        type="button"
                        className="w-full h-11 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </Link>
                  )}

                  {row.estado === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => handleSubmit(row.id)}
                      disabled={submittingId === row.id}
                      className="h-11 px-4 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingId === row.id ? "Enviando..." : "Enviar"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 7. DESKTOP TABLE VIEW (Matching PM dark-justificaciones.svg) */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[10.5px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
                <th className="py-3.5 px-4">TRABAJADOR</th>
                <th className="py-3.5 px-4">MOTIVO</th>
                <th className="py-3.5 px-4">DOCUMENTO</th>
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                    No se encontraron justificaciones.
                  </td>
                </tr>
              ) : (
                filteredItems.map((row) => {
                  const badge = getStatusBadge(row.estado);
                  const isObservation = row.estado === "OBSERVATION";

                  return (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                            CM
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{row.userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{row.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground max-w-xs truncate">
                        <span className="text-foreground/90 font-medium">{row.motivo}</span>
                        {row.comment && (
                          <p className="text-[11px] text-amber-400 italic truncate mt-0.5">
                            Obs: {row.comment}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {row.documentUrl ? (
                          <a
                            href={row.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Ver adjunto
                          </a>
                        ) : (
                          <span className="italic text-muted-foreground text-xs">Sin documento</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-foreground">{row.fecha}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/team-member/justificaciones/${row.id}`}>
                            <button
                              title="Ver detalle"
                              className="w-9 h-9 rounded-xl border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                          </Link>

                          {isObservation && (
                            <Link href={`/team-member/justificar?justificationId=${row.id}`}>
                              <button
                                title="Editar justificación"
                                className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </Link>
                          )}

                          {row.estado === "PENDING" && (
                            <button
                              title="Enviar para revisión"
                              onClick={() => handleSubmit(row.id)}
                              disabled={submittingId === row.id}
                              className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                            </button>
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
      </div>

      {/* 8. PAGINATION FOOTER */}
      <div className="flex items-center justify-between pt-1 px-1">
        <span className="text-xs text-muted-foreground font-medium">
          {total} solicitud{total === 1 ? "" : "es"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground font-medium px-1">
            Página 1 de 1
          </span>
          <button
            type="button"
            disabled
            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
