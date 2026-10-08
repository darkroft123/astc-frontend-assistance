"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AlertTriangle, ChevronLeft, ChevronRight, Search, RefreshCw, Loader2, XCircle, Clock, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/DataTable";
import PeriodSelector from "@/components/period-selector";
import PageHeader from "@/components/layout/page-header";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { listAbsences, listJustifications } from "@/app/services/assistance.service";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";

import type { Period, DateRange, AbsenceItem, JustificationItem } from "@/components/types/dashboard";

export default function AbsencesPage() {
  const { token, hydrated, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
  const { project, loadingProject } = useUserProject();

  const [period, setPeriod] = useState<Period>("total");
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date().toISOString().split("T")[0];
    return { fromDate: "2024-01-01", toDate: today, label: "Total general", period: "total" };
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "justified">("all");
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceItem[]>([]);
  const [pendingAbsenceIds, setPendingAbsenceIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0, size: 5 });

  const metrics = useMemo(() => {
    const total = pagination.total;
    const justificadas = absenceRecords.filter(r => r.justified).length;
    const pendientes = absenceRecords.filter(r => pendingAbsenceIds.has(r.id)).length;
    const sinJustificar = total - justificadas - pendientes;
    return { total, justificadas, pendientes, sinJustificar };
  }, [absenceRecords, pagination.total, pendingAbsenceIds]);

  const loadData = async () => {
    if (!token || checkingAuth) return;
    try {
      setLoading(true);
      const result = await listAbsences(token, {
        page: currentPage - 1, size: 5,
        projectId: project?.id ?? null,
        fromDate: dateRange.fromDate, toDate: dateRange.toDate,
        type: null,
        justified: statusFilter === "all" ? null : statusFilter === "justified",
      });
      setAbsenceRecords(result?.items ?? []);
      setPagination({
        totalPages: Math.max(1, Math.ceil((result.total ?? 0) / (result.size ?? 10))),
        total: result.total ?? 0,
        size: result.size ?? 10,
      });
    } catch (error) {
      console.error("Error loading absences:", error);
      setAbsenceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [currentPage, dateRange, token, project, checkingAuth, statusFilter]);

  useEffect(() => {
    if (!token || checkingAuth) return;
    (async () => {
      try {
        const jResult = await listJustifications(token, {
          page: 0, size: 500,
          status: null,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        });
        const pending = new Set<string>();
        (jResult?.items ?? []).forEach((j: JustificationItem) => {
          if (j.absenceId && (j.status === "PENDING" || j.status === "SUBMITTED" || j.status === "OBSERVATION")) {
            pending.add(j.absenceId);
          }
        });
        setPendingAbsenceIds(pending);
      } catch { /* non-critical */ }
    })();
  }, [token, checkingAuth, dateRange]);

  const filteredData = useMemo(() => {
    return absenceRecords.filter(item =>
      item.date.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase())
    );
  }, [absenceRecords, search]);

  const getStatusLabel = (row: AbsenceItem) => {
    if (row.justified) return { label: "Justificada", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (pendingAbsenceIds.has(row.id)) return { label: "Pendiente", cls: "bg-blue-100 text-blue-700 border-blue-200" };
    return { label: "No justificada", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      FALTA_AUTOMATICA: "Falta Automática",
      UNJUSTIFIED: "Sin justificar",
      FALTA: "Falta",
      TARDE: "Tardanza",
      MEDICAL: "Médica",
    };
    return map[type] || type;
  };

  const columns: Column<AbsenceItem>[] = [
    { key: "date", header: "FECHA", render: (row) => <span className="font-medium text-foreground">{row.date}</span> },
    {
      key: "type", header: "MOTIVO",
      render: (row) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium text-zinc-700 text-sm">{getTypeLabel(row.type)}</span>
        </div>
      ),
    },
    {
      key: "status", header: "ESTADO",
      render: (row) => {
        const s = getStatusLabel(row);
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${s.cls}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      key: "actions", header: "ACCIONES",
      render: (row) => {
        if (row.justified) return <span className="text-zinc-400 text-xs italic">Completado</span>;
        if (pendingAbsenceIds.has(row.id)) return <span className="text-zinc-400 text-xs italic">En revisión</span>;
        return (
          <Link href={`/team-member/justificar?absenceId=${row.id}&date=${row.date}`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-[11px] font-bold px-3">JUSTIFICAR</Button>
          </Link>
        );
      },
    },
  ];

  if (!hydrated || checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen sm:h-[calc(100vh-70px)] bg-muted/50 overflow-y-auto sm:overflow-hidden">
      <div className="h-full max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
        <PageHeader
          categoryTag={{ badge: "COLABORADOR", text: "Panel de Asistencia" }}
          title="Mis Faltas"
          description="Listado de ausencias registradas y gestión de procesos de justificación"
          period={period}
          dateRange={dateRange}
          onPeriodChange={(r) => { setDateRange(r); setPeriod(r.period); setCurrentPage(1); }}
        />

        <Card className="flex-1 border-0 shadow-sm ring-1 ring-zinc-200/50 bg-card rounded-2xl overflow-hidden flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-col gap-4 mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SubMetricCard label="TOTAL" value={metrics.total} icon={<AlertTriangle className="w-5 h-5" />} />
                <SubMetricCard label="PENDIENTES" value={metrics.pendientes} color="blue" icon={<Clock className="w-5 h-5" />} />
                <SubMetricCard label="JUSTIFICADAS" value={metrics.justificadas} color="green" icon={<Ban className="w-5 h-5" />} />
                <SubMetricCard label="SIN JUSTIFICAR" value={metrics.sinJustificar} color="red" icon={<XCircle className="w-5 h-5" />} />
              </div>
              <div className="flex flex-wrap items-end gap-3 lg:ml-auto">
                <div className="flex flex-col w-full sm:w-auto sm:min-w-[180px]">
                  <label className="text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Buscar Falta</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Fecha o motivo..." className="pl-9 h-9 text-xs rounded-md border-border" />
                  </div>
                </div>
                <div className="flex flex-col w-full sm:w-auto sm:min-w-[140px]">
                  <label className="text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Estado</label>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setCurrentPage(1); }}>
                    <SelectTrigger className="h-9 text-xs rounded-md border-border"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las faltas</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="justified">Justificadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { loadData(); setCurrentPage(1); }} className="h-9 px-3 text-xs gap-2 border border-border bg-card text-zinc-700 hover:bg-background">
                  <RefreshCw className="w-3.5 h-3.5" /> Actualizar
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden border rounded-lg">
              <DataTable data={filteredData} columns={columns} loading={loading} emptyText="No se encontraron faltas registradas" maxHeight="100%" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center pb-2">
          <div className="flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-2 shadow-sm">
            <p className="text-xs text-zinc-600 font-medium">Página <span className="font-bold text-foreground">{currentPage}</span> de {pagination.totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= pagination.totalPages} onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-zinc-400 italic">{pagination.total} registros totales</p>
          </div>
        </div>
      </div>
    </div>
  );
}

