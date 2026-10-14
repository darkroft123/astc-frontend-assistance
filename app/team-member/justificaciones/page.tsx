"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable, Column } from "@/components/DataTable";

import { Search, FileText, Calendar as CalendarIcon, RefreshCw, ChevronLeft, ChevronRight, Loader2, Eye, Pencil, Send, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import PeriodSelector from "@/components/period-selector";
import PageHeader from "@/components/layout/page-header";
import { StatusBadge } from "@/components/atoms/status-badge";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";

import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { listJustifications, deleteJustification, submitJustification } from "@/app/services/assistance.service";
import { formatDateTime } from "@/lib/timezone";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import type { Period, DateRange, JustificationItem, JustificationPage } from "@/components/types/dashboard";

const PAGE_SIZE = 5;

export default function JustificationsPage() {
  const router = useRouter();
  const { hydrated, token, user, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);

  const [period, setPeriod] = useState<Period>("month");
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { fromDate: fmt(firstDay), toDate: fmt(today), label: "Este mes", period: "month" };
  });

  const [items, setItems] = useState<JustificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "SUBMITTED" | "OBSERVATION" | "APPROVED" | "REJECTED">("all");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const total = totalItems;
    const aprobadas = items.filter(i => i.status === "APPROVED").length;
    const pendientes = items.filter(i => i.status === "PENDING").length;
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
        setItems(result?.items ?? []);
        setTotalItems(result?.total ?? 0);
      } catch (err) {
        console.error(err);
        if (!cancelled) setItems([]);
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
    <div className="min-h-screen sm:h-[calc(100vh-70px)] bg-muted/50 overflow-y-auto sm:overflow-hidden">
      <div className="h-full max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">

        <PageHeader
          categoryTag={{ badge: "COLABORADOR", text: "Panel de Asistencia" }}
          title="Mis Justificaciones"
          description="Gestión y seguimiento de tus solicitudes de justificación y documentos adjuntos"
          period={period}
          dateRange={dateRange}
          onPeriodChange={(r) => { setDateRange(r); setPeriod(r.period); setPage(1); }}
        />

        <Card className="flex-1 border border-border shadow-sm bg-card rounded-[16px] overflow-hidden flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">

            <div className="flex flex-col gap-4 mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SubMetricCard label="TOTAL" value={metrics.total} icon={<FileText className="w-5 h-5" />} />
                <SubMetricCard label="APROBADAS" value={metrics.aprobadas} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
                <SubMetricCard label="PENDIENTES" value={metrics.pendientes} color="amber" icon={<Clock className="w-5 h-5" />} />
                <SubMetricCard label="% APROB." value={`${metrics.rate}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
              </div>

              <div className="flex flex-wrap items-end gap-3 lg:ml-auto">
                <div className="flex flex-col w-full sm:w-auto sm:min-w-[180px]">
                  <label className="text-[10px] font-bold text-text-4 mb-1 uppercase tracking-wider">Buscar Motivo</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-md border-border" placeholder="Ej: Médico, Personal..." />
                  </div>
                </div>

                <div className="flex flex-col w-full sm:w-auto sm:min-w-[140px]">
                  <label className="text-[10px] font-bold text-text-4 mb-1 uppercase tracking-wider">Filtrar Estado</label>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
                    <SelectTrigger className="h-9 text-xs rounded-md border-border"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PENDING">Borradores</SelectItem>
                      <SelectItem value="SUBMITTED">Enviados</SelectItem>
                      <SelectItem value="OBSERVATION">Observación</SelectItem>
                      <SelectItem value="APPROVED">Aprobadas</SelectItem>
                      <SelectItem value="REJECTED">Rechazadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="ghost" size="sm" onClick={() => setReloadKey(k => k + 1)}
                  className="h-9 px-3 text-xs gap-2 border border-border bg-card text-text-2 hover:bg-background">
                  <RefreshCw className="w-3.5 h-3.5" /> Actualizar
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden border rounded-lg">
              <DataTable data={filteredData} loading={loading} emptyText="No se encontraron justificaciones" maxHeight="100%"
                columns={[
                  { key: "submittedAt", header: "FECHA", render: (row) => <span className="text-foreground font-medium text-sm">{formatDateTime(row.submittedAt)}</span> },
                  { key: "description", header: "MOTIVO", render: (row) => <span className="text-primary font-medium text-sm line-clamp-1">{row.description ?? "-"}</span> },
                  { key: "documentUrl", header: "DOCUMENTO", render: (row) =>
                    row.documentUrl ? <a href={row.documentUrl} target="_blank" className="text-link hover:opacity-80 flex items-center gap-1.5 text-xs font-semibold"><FileText className="w-3.5 h-3.5" />VER ADJUNTO</a>
                    : <span className="text-text-4 text-xs italic">Sin documento</span>
                  },
                  { key: "comment", header: "OBSERVACIÓN", render: (row) => row.comment ? <span className="text-text-2 text-xs italic line-clamp-2 max-w-[200px]">{row.comment}</span> : <span className="text-text-5 text-xs"></span> },
                  { key: "status", header: "ESTADO", render: (row) => <StatusBadge status={row.status as any} /> },
                  { key: "actions", header: "ACCIONES", render: (row) => (
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                        onClick={() => router.push(`/team-member/justificaciones/${row.id}`)} title="Ver detalle"><Eye className="w-3.5 h-3.5" /></Button>

                      {row.status === "PENDING" && (
                        <>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber hover:text-amber hover:bg-amber/10 rounded-lg"
                            onClick={() => router.push(`/team-member/justificar?justificationId=${row.id}`)} title="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" className="h-8 px-2.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm"
                            onClick={() => handleSubmit(row.id)} disabled={submittingId === row.id}>
                            <Send className="w-3 h-3 mr-1" />Enviar
                          </Button>
                        </>
                      )}
                      {row.status === "OBSERVATION" && (
                        <>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber hover:text-amber hover:bg-amber/10 rounded-lg"
                            onClick={() => router.push(`/team-member/justificar?justificationId=${row.id}`)} title="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" className="h-8 px-2.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm"
                            onClick={() => handleSubmit(row.id)} disabled={submittingId === row.id}>
                            <Send className="w-3 h-3 mr-1" />Reenviar
                          </Button>
                        </>
                      )}
                    </div>
                  )},
                ]} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center pb-2">
          <div className="flex items-center gap-4 bg-card border border-border rounded-[9px] px-5 py-2 shadow-sm">
            <p className="text-xs text-text-2 font-medium">Página <span className="font-bold text-foreground">{page}</span> de {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-text-4 italic">{totalItems} registros totales</p>
          </div>
        </div>

      </div>
    </div>
  );
}

