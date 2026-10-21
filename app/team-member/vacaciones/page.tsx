"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataTable, Column } from "@/components/DataTable";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import {
  listMyVacations,
  getMyVacationBalance,
  requestVacation,
  cancelVacation,
  getMyVacationEligibility,
  getMyProjects,
} from "@/app/services/assistance.service";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  Plus,
  Sun,
  XCircle,
  Loader2,
  Ban,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldAlert,
  Hourglass,
  PlaneTakeoff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { jwtDecode } from "jwt-decode";

import { StatusBadge } from "@/components/atoms/status-badge";
import { NotificationBell } from "@/components/layout/notification-bell";
import type { VacationEligibility } from "@/components/types/dashboard";

export default function VacationsPage() {
  const { hydrated, token, user, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
  const { toast } = useToast();

  const [vacations, setVacations] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<VacationEligibility | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const userIdFromToken = useMemo(() => {
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded?.sub || decoded?.id || null;
    } catch {
      return null;
    }
  }, [token]);

  const vacationDates = useMemo(() => {
    const dates: Date[] = [];
    if (!Array.isArray(vacations)) return dates;
    for (const v of vacations) {
      if (!v?.startDate || !v?.endDate) continue;
      if (v.status !== "APPROVED" && v.status !== "PENDING") continue;
      const start = new Date(v.startDate + "T00:00:00");
      const end = new Date(v.endDate + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    }
    return dates;
  }, [vacations]);

  const fetchData = useCallback(async () => {
    const uid = userIdFromToken;
    if (!token || !uid) return;
    setLoading(true);
    try {
      const [vacList, bal, projectsRes] = await Promise.all([
        listMyVacations(token, uid).catch(() => null),
        getMyVacationBalance(token, uid).catch(() => null),
        getMyProjects(token).catch(() => null),
      ]);

      if (Array.isArray(vacList)) {
        setVacations(vacList);
      } else if (vacList && Array.isArray((vacList as any).data)) {
        setVacations((vacList as any).data);
      } else {
        setVacations([]);
      }

      if (bal) {
        setBalance(bal);
      }

      // Get first project
      const proj = projectsRes?.[0];
      if (proj?.id) {
        setProjectId(proj.id);
        const elig = await getMyVacationEligibility(token, proj.id).catch(() => null);
        if (elig) setEligibility(elig);
      }
    } catch (e) {
      console.error("Error fetching vacations", e);
    } finally {
      setLoading(false);
    }
  }, [token, userIdFromToken]);

  useEffect(() => {
    if (hydrated && !checkingAuth) fetchData();
  }, [hydrated, checkingAuth, fetchData]);

  const selectedRangeOverlaps = useMemo(() => {
    if (!startDate || !endDate) return false;
    if (!Array.isArray(vacations)) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (const v of vacations) {
      if (!v?.startDate || !v?.endDate) continue;
      if (v.status !== "APPROVED" && v.status !== "PENDING") continue;
      const vStart = new Date(v.startDate + "T00:00:00");
      const vEnd = new Date(v.endDate + "T00:00:00");
      if (start <= vEnd && end >= vStart) return true;
    }
    return false;
  }, [startDate, endDate, vacations]);

  const businessDaysBetween = (start: Date, end: Date): number => {
    let count = 0;
    const d = new Date(start);
    while (d <= end) {
      count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  };

  const handleRequest = async () => {
    const uid = userIdFromToken;
    if (!startDate || !endDate || !token || !uid || !projectId) return;
    const days = businessDaysBetween(startDate, endDate);
    if (days < 1) return;

    setSubmitting(true);
    try {
      await requestVacation(token, {
        userId: uid,
        projectId,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        businessDays: days,
        comment: comment || undefined,
      });
      setDialogOpen(false);
      setStartDate(undefined);
      setEndDate(undefined);
      setComment("");
      fetchData();
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de vacaciones ha sido registrada.",
      });
    } catch (e: any) {
      console.error("Error al solicitar vacaciones:", e);
      toast({
        title: "Solicitud rechazada",
        description: e.message || "Verifique su conexión o intente más tarde",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!token) return;
    try {
      await cancelVacation(token, id);
      fetchData();
      toast({
        title: "Solicitud cancelada",
        description: "Se canceló la solicitud de vacaciones.",
      });
    } catch (e: any) {
      toast({
        title: "Error al cancelar",
        description: e.message || "No se pudo cancelar la solicitud",
        variant: "destructive",
      });
    }
  };

  const formatDateCell = (dateStr: string) => {
    try {
      return format(new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00")), "dd MMM yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const columns: Column<any>[] = [
    {
      key: "startDate",
      header: "INICIO",
      render: (r) => (
        <span className="font-mono text-xs text-foreground font-medium">
          {formatDateCell(r.startDate)}
        </span>
      ),
    },
    {
      key: "endDate",
      header: "FIN",
      render: (r) => (
        <span className="font-mono text-xs text-foreground font-medium">
          {formatDateCell(r.endDate)}
        </span>
      ),
    },
    {
      key: "businessDays",
      header: "DÍAS HÁBILES",
      render: (r) => (
        <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 font-semibold text-xs inline-block">
          {r.businessDays}
        </span>
      ),
    },
    {
      key: "status",
      header: "ESTADO",
      render: (r) => <StatusBadge status={r.status as any} />,
    },
    {
      key: "createdAt",
      header: "FECHA SOLICITUD",
      render: (r) => (
        <span className="font-mono text-xs text-text-4">
          {formatDateCell(r.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACCIONES",
      render: (r) =>
        r.status === "PENDING" ? (
          <button
            onClick={() => handleCancel(r.id)}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancelar
          </button>
        ) : null,
    },
  ];

  if (checkingAuth || !hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-text-4">Cargando...</p>
      </div>
    );
  }

  const safeVacations = Array.isArray(vacations) ? vacations : [];
  const filtered = statusFilter === "ALL" ? safeVacations : safeVacations.filter((v: any) => v.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="w-full min-h-screen pb-12">
      <div className="w-full max-w-[1400px] mx-auto px-0 md:px-0 space-y-4 md:space-y-6">

        {/* ================= 1. HEADER (EXACT SVG DESIGN) ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-wider text-violet uppercase mb-1">
              TRABAJADOR <span className="text-text-4 font-normal">· Panel de asistencia</span>
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Gestión de vacaciones
            </h1>
            <p className="text-xs sm:text-sm text-text-4 mt-1">
              Planifica tu descanso anual, revisa tus saldos disponibles y haz seguimiento al estado de tus solicitudes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              onClick={() => { fetchData(); setDialogOpen(true); }}
              disabled={balance?.availableDays === 0}
              title={balance?.availableDays === 0 ? "No tienes días de vacaciones disponibles" : ""}
              className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#5B8CFF] to-[#22C3E6] hover:opacity-90 text-white shadow-lg shadow-blue-500/20 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nueva solicitud
            </Button>
            <div className="hidden md:flex">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* ================= 2. ELIGIBILITY BANNER ================= */}
        {eligibility && !eligibility.isEligible ? (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber/20 bg-amber/5">
            <Hourglass className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-ink text-sm">Aún no puedes solicitar vacaciones</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Debes completar al menos <strong>{eligibility.requiredDays} días</strong> en el proyecto para poder solicitar vacaciones.
                Has completado <strong>{Math.max(0, eligibility.daysElapsed)} días</strong>. Te faltan <strong>{eligibility.daysRemaining} días</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Cumples con los {eligibility?.requiredDays ?? 0} días requeridos. ¡Puedes solicitar vacaciones!
            </span>
          </div>
        )}

        {/* ================= 3. 4 KPI METRIC CARDS (EXACT SVG DESIGN) ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total días */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Total días</span>
              <CalendarIcon className="w-4 h-4 text-text-4" />
            </div>
            <div className="text-3xl font-extrabold text-foreground mt-3 font-mono">
              {balance?.totalDays ?? 30}
            </div>
          </div>

          {/* Disponibles */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>Disponibles</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-foreground mt-3 font-mono">
              {balance?.availableDays ?? 2}
            </div>
          </div>

          {/* Pendientes */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
              <span>Pendientes</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-foreground mt-3 font-mono">
              {balance?.pendingDays ?? 28}
            </div>
          </div>

          {/* Utilizados */}
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
              <span>Utilizados</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-foreground mt-3 font-mono">
              {balance?.usedDays ?? 0}
            </div>
          </div>
        </div>

        {/* ================= 4. TABLE CARD ================= */}
        <Card className="border border-border/70 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Historial de solicitudes
              </h2>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="text-xs border border-gray-200 dark:border-border/80 rounded-xl px-3 py-1.5 text-gray-900 dark:text-foreground bg-white dark:bg-raised cursor-pointer font-medium outline-none shadow-xs"
              >
                <option className="bg-white text-gray-900 dark:bg-[#121626] dark:text-white" value="ALL">Todas</option>
                <option className="bg-white text-gray-900 dark:bg-[#121626] dark:text-white" value="PENDING">Pendientes</option>
                <option className="bg-white text-gray-900 dark:bg-[#121626] dark:text-white" value="APPROVED">Aprobadas</option>
                <option className="bg-white text-gray-900 dark:bg-[#121626] dark:text-white" value="REJECTED">Rechazadas</option>
                <option className="bg-white text-gray-900 dark:bg-[#121626] dark:text-white" value="CANCELLED">Canceladas</option>
              </select>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-text-4">Cargando solicitudes...</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards (md:hidden) */}
                <div className="md:hidden space-y-3">
                  {paginated.length === 0 ? (
                    <div className="text-center py-8 text-xs text-text-4">
                      No se encontraron solicitudes de vacaciones
                    </div>
                  ) : (
                    paginated.map((vac: any) => (
                      <div
                        key={vac.id}
                        className="rounded-2xl border border-border/70 bg-field/30 p-4 space-y-3"
                      >
                        {/* Top: Status badge + Solicitado el */}
                        <div className="flex items-center justify-between">
                          <StatusBadge status={vac.status as any} />
                          <span className="text-[11px] font-mono text-text-4">
                            Solicitado el {formatDateCell(vac.createdAt)}
                          </span>
                        </div>

                        {/* Dates row: INICIO -> FIN */}
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider block">
                              INICIO
                            </span>
                            <span className="font-bold text-sm text-foreground">
                              {formatDateCell(vac.startDate)}
                            </span>
                          </div>
                          <div className="text-text-4 font-mono text-sm">&rarr;</div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider block">
                              FIN
                            </span>
                            <span className="font-bold text-sm text-foreground">
                              {formatDateCell(vac.endDate)}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-border/50 pt-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 font-mono font-bold text-xs">
                              {vac.businessDays}
                            </span>
                            <span className="text-xs text-text-4">días hábiles</span>
                          </div>
                          {vac.status === "PENDING" && (
                            <button
                              onClick={() => handleCancel(vac.id)}
                              className="border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table (hidden md:block) */}
                <div className="hidden md:block border border-border/60 rounded-xl overflow-hidden bg-background/30">
                  <DataTable
                    columns={columns}
                    data={paginated}
                    emptyText="No se encontraron solicitudes de vacaciones"
                  />
                </div>
              </>
            )}

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-text-4 font-mono">
                {filtered.length} {filtered.length === 1 ? "registro total" : "registros totales"}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-3 font-medium">
                    Página <strong className="text-foreground">{page}</strong> de {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg border-border"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      &larr;
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg border-border"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      &rarr;
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ================= MODAL SOLICITAR VACACIONES ================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-border shadow-2xl bg-card">
          <div className="bg-gradient-to-r from-[#5B8CFF] to-[#22C3E6] p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Sun className="w-6 h-6 text-amber-300 drop-shadow-sm" />
            </div>
            <DialogTitle className="text-2xl font-extrabold text-white">
              Solicitar Vacaciones
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              Selecciona los días que deseas tomar de descanso
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5 bg-card max-h-[60vh] overflow-y-auto">
            {eligibility && !eligibility.isEligible && (
              <div className="bg-amber/10 border border-amber/20 rounded-xl p-4 text-center space-y-1">
                <Hourglass className="w-6 h-6 text-amber mx-auto" />
                <p className="font-bold text-amber-ink text-sm">Aún no cumples los días mínimos</p>
                <p className="text-xs text-amber-ink">
                  Te faltan <strong>{eligibility.daysRemaining === 1 ? `${eligibility.daysRemaining} día` : `${eligibility.daysRemaining} días`}</strong> de los {eligibility.requiredDays} requeridos
                </p>
              </div>
            )}

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-emerald-400">
                Días disponibles: <span className="text-lg font-mono">{balance?.availableDays ?? 0}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-4 uppercase tracking-wider">Fecha Inicio</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-xs rounded-xl h-11 border-border shadow-sm hover:bg-background", !startDate && "text-text-4 font-normal")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-border" align="start">
                    <Calendar
                      mode="single" selected={startDate} onSelect={setStartDate}
                      locale={es} className="rounded-xl"
                      disabled={vacationDates}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-4 uppercase tracking-wider">Fecha Fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-xs rounded-xl h-11 border-border shadow-sm hover:bg-background", !endDate && "text-text-4 font-normal")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-border" align="start">
                    <Calendar
                      mode="single" selected={endDate} onSelect={setEndDate}
                      locale={es} className="rounded-xl"
                      disabled={vacationDates}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {startDate && endDate && (
              <div className="bg-primary/5 rounded-xl border border-primary/15 overflow-hidden p-4 text-center">
                <p className="text-xs text-text-3 mb-1">Días a solicitar:</p>
                <p className="text-3xl font-extrabold text-primary font-mono">
                  {businessDaysBetween(startDate, endDate)}
                </p>
                {balance && businessDaysBetween(startDate, endDate) > (balance.availableDays ?? 0) && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 py-1.5 px-3 rounded-lg">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Supera tu saldo disponible de {balance.availableDays} días
                  </div>
                )}
                {selectedRangeOverlaps && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 py-1.5 px-3 rounded-lg">
                    <Ban className="w-4 h-4 shrink-0" />
                    Ya tienes una solicitud en este rango
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-4 uppercase tracking-wider">Comentario (Opcional)</label>
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ej: Viaje familiar..."
                className="rounded-xl h-11 text-xs border-border bg-background/50"
              />
            </div>
          </div>

          <div className="bg-background/80 p-4 px-6 border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-10 px-5 text-xs font-semibold border-border">
              Cancelar
            </Button>
            <Button
              onClick={handleRequest}
              disabled={!startDate || !endDate || submitting || (eligibility && !eligibility.isEligible) || (balance && businessDaysBetween(startDate, endDate) > (balance.availableDays ?? 999)) || selectedRangeOverlaps}
              className="bg-gradient-to-r from-[#5B8CFF] to-[#22C3E6] text-white rounded-xl h-10 px-6 text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlaneTakeoff className="w-4 h-4 mr-2" />}
              Enviar Solicitud
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
