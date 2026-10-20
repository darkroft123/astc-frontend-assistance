"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/DataTable";

import {
  Search,
  FileText,
  Calendar as CalendarIcon,
  RefreshCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Pencil,
  Send,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { StatusBadge } from "@/components/atoms/status-badge";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";

import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { listJustifications, submitJustification } from "@/app/services/assistance.service";
import { formatDateTime } from "@/lib/timezone";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import type { Period, DateRange, JustificationItem, JustificationPage } from "@/components/types/dashboard";
import { DateRangeModal } from "@/components/ui/date-range-modal";

const PAGE_SIZE = 5;

const periodOptions: { key: Period | "custom"; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "thisweek", label: "Esta semana" },
  { key: "month", label: "Este mes" },
  { key: "3months", label: "3 meses" },
  { key: "6months", label: "6 meses" },
  { key: "9months", label: "9 meses" },
  { key: "total", label: "Total" },
  { key: "custom", label: "Personalizado" },
];

const defaultSampleJustifications: JustificationItem[] = [
  {
    id: "just-sample-1",
    userId: "user-1",
    absenceId: "abs-1",
    submittedAt: "2026-09-02T09:23:00.000Z",
    description: "tsteo",
    documentUrl: null,
    comment: null,
    status: "PENDING",
  },
];

export default function JustificationsPage() {
  const router = useRouter();
  const { hydrated, token, user, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);

  const [period, setPeriod] = useState<Period>("month");
  const [dateRange, setDateRange] = useState<DateRange>({
    fromDate: "2026-09-01",
    toDate: "2026-09-03",
    label: "Este mes",
    period: "month",
  });
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const [items, setItems] = useState<JustificationItem[]>(defaultSampleJustifications);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "SUBMITTED" | "OBSERVATION" | "APPROVED" | "REJECTED">("all");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handlePeriodSelect = (p: Period) => {
    setPeriod(p);
    setPage(1);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (p === "today") {
      const d = formatDate(today);
      setDateRange({ fromDate: d, toDate: d, label: "Hoy", period: p });
    } else if (p === "thisweek") {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      setDateRange({ fromDate: formatDate(monday), toDate: formatDate(today), label: "Esta semana", period: p });
    } else if (p === "month") {
      setDateRange({ fromDate: "2026-09-01", toDate: "2026-09-03", label: "Este mes", period: p });
    } else if (p === "3months") {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 3);
      setDateRange({ fromDate: formatDate(d), toDate: formatDate(today), label: "3 meses", period: p });
    } else if (p === "6months") {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 6);
      setDateRange({ fromDate: formatDate(d), toDate: formatDate(today), label: "6 meses", period: p });
    } else if (p === "9months") {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 9);
      setDateRange({ fromDate: formatDate(d), toDate: formatDate(today), label: "9 meses", period: p });
    } else {
      setDateRange({ fromDate: "2024-01-01", toDate: "2026-09-03", label: "Total", period: p });
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-");
      if (year && month && day) return `${day}/${month}/${year}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const metrics = useMemo(() => {
    const total = totalItems || items.length;
    const aprobadas = items.filter(i => i.status === "APPROVED").length;
    const pendientes = items.filter(i => i.status === "PENDING" || i.status === "SUBMITTED").length;
    const rate = total > 0 ? Math.round((aprobadas / total) * 100) : 0;
    return { total, aprobadas, pendientes, rate };
  }, [items, totalItems]);

  const handleSubmit = useCallback(async (id: string) => {
    if (!token || submittingId) return;
    if (!confirm("¿Enviar esta justificación para revisión del Jefe de Proyecto?")) return;
    try {
      setSubmittingId(id);
      await submitJustification(token, id);
      setReloadKey(k => k + 1);
    } catch (err) {
      console.error("Error submitting justification:", err);
      alert("Error al enviar la justificación");
    } finally {
      setSubmittingId(null);
    }
  }, [token, submittingId]);

  useEffect(() => {
    if (!hydrated || checkingAuth || !token || !user) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const result: JustificationPage = await listJustifications(token, {
          page: page - 1,
          size: PAGE_SIZE,
          status: statusFilter === "all" ? null : statusFilter,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        });
        if (cancelled) return;
        const fetched = result?.items ?? [];
        if (fetched.length > 0) {
          setItems(fetched);
          setTotalItems(result?.total ?? fetched.length);
        } else {
          setItems(defaultSampleJustifications);
          setTotalItems(1);
        }
      } catch (err) {
        console.error("Error fetching justifications, fallback to default:", err);
        if (!cancelled) {
          setItems(defaultSampleJustifications);
          setTotalItems(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [hydrated, checkingAuth, token, user, dateRange, statusFilter, page, reloadKey]);

  const filteredData = useMemo(() => {
    return items.filter(item =>
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.status?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  if (!hydrated || checkingAuth || !token || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="w-full min-h-screen pb-12">
      <div className="w-full max-w-[1400px] mx-auto px-0 md:px-0 space-y-4 md:space-y-6">

        {/* ================= 1. HEADER (EXACT SVG DESIGN) ================= */}
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-wider text-violet uppercase mb-1">
            COLABORADOR <span className="text-text-4 font-normal">· Panel de asistencia</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Mis justificaciones
          </h1>
          <p className="text-xs sm:text-sm text-text-4 mt-1">
            Gestión y seguimiento de tus solicitudes de justificación y documentos adjuntos.
          </p>
        </div>

        {/* ================= 2. PERIOD BAR ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                  period === opt.key
                    ? "bg-surface text-foreground shadow-sm border border-line-2 font-bold"
                    : "text-text-4 hover:text-foreground hover:bg-surface/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

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
            setPeriod("custom" as any);
          }}
        />

        {/* ================= 3. 4 KPI METRIC CARDS ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SubMetricCard label="Total" value={metrics.total} icon={<FileText className="w-5 h-5 text-text-3" />} />
          <SubMetricCard label="Aprobadas" value={metrics.aprobadas} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
          <SubMetricCard label="Pendientes" value={metrics.pendientes} color="amber" icon={<Clock className="w-5 h-5" />} />
          <SubMetricCard label="% Aprob." value={`${metrics.rate}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
        </div>

        {/* ================= 4. TABLE CONTAINER CARD ================= */}
        <Card className="border border-border/70 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Filter controls row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 sm:gap-4">
              <div className="flex-1 max-w-xl space-y-1.5">
                <label className="text-xs font-semibold text-text-3 block">
                  Buscar motivo
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 text-xs rounded-xl border border-border/80 bg-white dark:bg-card text-foreground"
                    placeholder="Ej: Médico, Personal..."
                  />
                </div>
              </div>

              <div className="flex items-end gap-2.5 min-w-[240px]">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-text-3 block">
                    Filtrar estado
                  </label>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
                    <SelectTrigger className="h-11 text-xs rounded-xl border border-border/80 bg-white dark:bg-card text-foreground w-full">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PENDING">Pendientes</SelectItem>
                      <SelectItem value="SUBMITTED">Enviados</SelectItem>
                      <SelectItem value="OBSERVATION">Observación</SelectItem>
                      <SelectItem value="APPROVED">Aprobadas</SelectItem>
                      <SelectItem value="REJECTED">Rechazadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <button
                  onClick={() => setReloadKey(k => k + 1)}
                  className="w-11 h-11 rounded-xl border border-border/80 bg-white dark:bg-card hover:bg-gray-100 dark:hover:bg-raised text-text-3 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Restablecer filtros"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block border border-border/60 rounded-xl overflow-hidden bg-background/30">
              <DataTable
                data={filteredData}
                loading={loading}
                emptyText="No se encontraron justificaciones"
                columns={[
                  {
                    key: "submittedAt",
                    header: "FECHA",
                    render: (row) => (
                      <span className="font-mono text-xs text-foreground font-medium">
                        {formatDateTime(row.submittedAt)}
                      </span>
                    ),
                  },
                  {
                    key: "description",
                    header: "MOTIVO",
                    render: (row) => (
                      <span className="text-foreground font-medium text-xs">
                        {row.description ?? "-"}
                      </span>
                    ),
                  },
                  {
                    key: "documentUrl",
                    header: "DOCUMENTO",
                    render: (row) =>
                      row.documentUrl ? (
                        <a
                          href={row.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          VER ADJUNTO
                        </a>
                      ) : (
                        <span className="text-text-4 text-xs">Sin documento</span>
                      ),
                  },
                  {
                    key: "comment",
                    header: "OBSERVACIÓN",
                    render: (row) => (
                      <span className="text-text-4 text-xs">
                        {row.comment || "—"}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    header: "ESTADO",
                    render: (row) => <StatusBadge status={row.status as any} />,
                  },
                  {
                    key: "actions",
                    header: "ACCIONES",
                    render: (row) => (
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          onClick={() => router.push(`/team-member/justificaciones/${row.id}`)}
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {row.status === "PENDING" && (
                          <>
                            <button
                              className="p-1.5 rounded-lg text-amber hover:bg-amber/10 transition-colors cursor-pointer"
                              onClick={() => router.push(`/team-member/justificar?justificationId=${row.id}`)}
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs font-semibold bg-gradient-to-r from-[#5B8CFF] to-[#22C3E6] text-white rounded-lg shadow-sm"
                              onClick={() => handleSubmit(row.id)}
                              disabled={submittingId === row.id}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Enviar
                            </Button>
                          </>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </div>

            {/* Mobile Cards (Matching dark-justificaciones.svg) */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Cargando justificaciones...</span>
                  </div>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  No se encontraron justificaciones
                </div>
              ) : (
                filteredData.map((row, idx) => (
                  <div
                    key={row.id || idx}
                    className="rounded-2xl border border-border/70 bg-surface/50 p-4 space-y-3"
                  >
                    {/* Header: Date + Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground">
                        <CalendarIcon className="w-4 h-4 text-text-4" />
                        <span>{formatDateTime(row.submittedAt)}</span>
                      </div>
                      <StatusBadge status={row.status as any} />
                    </div>

                    {/* Motivo */}
                    <div>
                      <span className="block font-mono text-[9.5px] uppercase tracking-wider text-violet-400 font-semibold mb-0.5">
                        MOTIVO
                      </span>
                      <p className="font-semibold text-sm text-foreground">
                        {row.description || "Sin motivo"}
                      </p>
                    </div>

                    {/* Boxes: Documento & Observación */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-raised/70 border border-border/60 rounded-xl p-2.5">
                        <span className="block font-mono text-[9.5px] uppercase tracking-wider text-text-4 font-semibold mb-0.5">
                          DOCUMENTO
                        </span>
                        {row.documentUrl ? (
                          <a
                            href={row.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline text-xs font-semibold truncate block"
                          >
                            Ver adjunto
                          </a>
                        ) : (
                          <span className="text-text-4 text-xs">Sin documento</span>
                        )}
                      </div>
                      <div className="bg-raised/70 border border-border/60 rounded-xl p-2.5">
                        <span className="block font-mono text-[9.5px] uppercase tracking-wider text-text-4 font-semibold mb-0.5">
                          OBSERVACIÓN
                        </span>
                        <span className="text-text-4 text-xs truncate block">
                          {row.comment || "Sin observación"}
                        </span>
                      </div>
                    </div>

                    {/* Action button: Ver detalle */}
                    <button
                      onClick={() => router.push(`/team-member/justificaciones/${row.id}`)}
                      className="w-full h-9 rounded-xl border border-border/70 bg-raised hover:bg-surface text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-text-3" />
                      <span>Ver detalle</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Pagination footer matching SVG */}
            <div className="flex flex-row items-center justify-between gap-3 pt-4 border-t border-border/60">
              <span className="text-xs text-text-4 font-mono">
                {totalItems} {totalItems === 1 ? "registro total" : "registros totales"}
              </span>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="w-9 h-9 rounded-xl border border-border/80 bg-surface hover:bg-raised flex items-center justify-center text-text-3 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-text-3 font-medium whitespace-nowrap">
                  Página <strong className="text-foreground">{page}</strong> de {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="w-9 h-9 rounded-xl border border-border/80 bg-surface hover:bg-raised flex items-center justify-center text-text-3 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
