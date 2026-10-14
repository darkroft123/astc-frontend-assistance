"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataTable, Column } from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "@/components/layout/page-header";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import {
  listMyVacations, getMyVacationBalance, requestVacation, cancelVacation, getMyVacationEligibility, getMyProjects, } from "@/app/services/assistance.service";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Plus, Sun, XCircle, Loader2, Ban, CheckCircle2, Clock, PlaneTakeoff, ShieldAlert, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { jwtDecode } from "jwt-decode";

import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import type { VacationEligibility } from "@/components/types/dashboard";

export default function VacationsPage() {
  const { hydrated, token, user, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
  const { toast } = useToast();

  const [vacations, setVacations] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    } catch { return null; }
  }, [token]);

  const vacationDates = useMemo(() => {
    const dates: Date[] = [];
    for (const v of vacations) {
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
        listMyVacations(token, uid),
        getMyVacationBalance(token, uid),
        getMyProjects(token),
      ]);
      setVacations(vacList);
      setBalance(bal);

      // Get first project
      const proj = projectsRes?.[0];
      if (proj?.id) {
        setProjectId(proj.id);
        const elig = await getMyVacationEligibility(token, proj.id);
        setEligibility(elig);
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (const v of vacations) {
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
    } catch (e: any) {
      console.error("? Error al solicitar vacaciones:", e);
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
    } catch (e: any) {
      toast({
        title: "Error al cancelar",
        description: e.message || "No se pudo cancelar la solicitud",
        variant: "destructive",
      });
    }
  };

  const statusBadge = (status: string) => {
    return <StatusBadge status={status as any} />;
  };

  const columns: Column<any>[] = [
    { key: "startDate", header: "INICIO", render: (r) => <span className="font-medium text-muted-foreground">{format(new Date(r.startDate), "dd MMM yyyy", { locale: es })}</span> },
    { key: "endDate", header: "FIN", render: (r) => <span className="font-medium text-muted-foreground">{format(new Date(r.endDate), "dd MMM yyyy", { locale: es })}</span> },
    { key: "businessDays", header: "DÍAS HÁBILES", render: (r) => <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{r.businessDays === 1 ? `${r.businessDays} día` : `${r.businessDays} días`}</span> },
    { key: "status", header: "ESTADO", render: (r) => statusBadge(r.status) },
    { key: "createdAt", header: "FECHA SOLICITUD", render: (r) => <span className="text-text-4 text-sm">{format(new Date(r.createdAt), "dd MMM yyyy", { locale: es })}</span> },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "PENDING" ? (
          <Button variant="ghost" size="sm" onClick={() => handleCancel(r.id)} className="text-red-ink hover:text-red-ink hover:bg-red/10 transition-all rounded-[9px] h-8 px-3">
            <XCircle className="w-4 h-4 mr-1.5" />
            Cancelar
          </Button>
        ) : null,
    },
  ];

  if (checkingAuth || !hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-text-4 animate-pulse">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <PageHeader
          categoryTag={{ badge: "COLABORADOR", text: "Panel de Asistencia" }}
          title="Gestión de Vacaciones"
              description="Planifica tu descanso anual, revisa tus saldos disponibles y haz seguimiento al estado de tus solicitudes"
              showPeriodSelector={false}
            />
          </div>
          <Button
            onClick={() => { fetchData(); setDialogOpen(true); }}
            disabled={balance?.availableDays === 0}
            title={balance?.availableDays === 0 ? "No tienes días de vacaciones disponibles" : ""}
            variant="gradient"
            className="h-11 px-5 text-sm font-bold shrink-0 mt-1 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nueva solicitud
          </Button>
        </div>

        {/* ELIGIBILITY BANNER */}
        {eligibility && !eligibility.isEligible && (
          <Card className="border border-amber/20 bg-amber/5 rounded-2xl mb-6 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center shrink-0">
                  <Hourglass className="w-5 h-5 text-amber" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-amber-ink text-sm">Aún no puedes solicitar vacaciones</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Debes completar al menos <strong>{eligibility.requiredDays === 1 ? `${eligibility.requiredDays} día` : `${eligibility.requiredDays} días`}</strong> en el proyecto para poder solicitar vacaciones.
                    Has completado <strong>{Math.max(0, eligibility.daysElapsed) === 1 ? `${Math.max(0, eligibility.daysElapsed)} día` : `${Math.max(0, eligibility.daysElapsed)} días`}</strong>.
                    Te faltan <strong>{eligibility.daysRemaining === 1 ? `${eligibility.daysRemaining} día` : `${eligibility.daysRemaining} días`}</strong>.
                  </p>
                  {eligibility.joinDate && (
                    <p className="text-[11px] text-amber/80 pt-1 font-mono">Fecha de ingreso: {format(new Date(eligibility.joinDate), "dd MMM yyyy", { locale: es })}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {eligibility && eligibility.isEligible && balance?.availableDays === 0 && (
          <Card className="border border-amber/20 bg-amber/5 rounded-2xl mb-6 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5 text-amber-ink">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <p className="font-semibold text-sm">
                  Has utilizado todos tus días de vacaciones. Debes esperar al próximo ciclo para conseguir más días.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {eligibility && eligibility.isEligible && balance?.availableDays !== 0 && (
          <Card className="border border-green/20 bg-green/5 rounded-2xl mb-6 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5 text-green-ink">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p className="font-semibold text-sm">
                  Cumples con los {eligibility.requiredDays} días requeridos. ¡Puedes solicitar vacaciones!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics with SubMetricCard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <SubMetricCard label="Total Días" value={balance?.totalDays ?? "-"} icon={<CalendarIcon className="w-5 h-5" />} />
          <SubMetricCard label="Disponibles" value={balance?.availableDays ?? "-"} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
          <SubMetricCard label="Pendientes" value={balance?.pendingDays ?? "-"} color="amber" icon={<Clock className="w-5 h-5" />} />
          <SubMetricCard label="Utilizados" value={balance?.usedDays ?? "-"} color="blue" icon={<PlaneTakeoff className="w-5 h-5" />} />
        </div>

        {/* History Table */}
        <Card className="border border-border shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/40 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                Historial de Solicitudes
              </CardTitle>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="text-xs border border-border rounded-xl px-3 py-1.5 text-foreground bg-background cursor-pointer"
              >
                <option value="ALL">Todas</option>
                <option value="PENDING">Pendientes</option>
                <option value="APPROVED">Aprobadas</option>
                <option value="REJECTED">Rechazadas</option>
                <option value="CANCELLED">Canceladas</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-text-4 font-medium">Cargando historial...</p>
              </div>
            ) : (() => {
              const filtered = statusFilter === "ALL" ? vacations : vacations.filter((v: any) => v.status === statusFilter);
              const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
              const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
              return filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 ring-1 ring-border">
                    <PlaneTakeoff className="w-8 h-8 text-text-3" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-2 mb-1">Aún no hay solicitudes</h3>
                  <p className="text-sm text-text-4 max-w-sm">No has solicitado vacaciones todavía. Puedes crear una nueva solicitud en cualquier momento.</p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <DataTable columns={columns} data={paginated} />
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 py-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">Página {page} de {totalPages}</span>
                      <div className="flex gap-1">
                        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 text-xs border rounded-md disabled:opacity-30 hover:bg-background">&larr;</button>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 text-xs border rounded-md disabled:opacity-30 hover:bg-background">&rarr;</button>
                      </div>
                      <span className="text-xs text-muted-foreground">{filtered.length} registros</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

      </div>

      {/* Modern Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-0 overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-primary to-primary/70 p-6 text-primary-foreground text-center">
            <div className="w-12 h-12 bg-primary-foreground/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Sun className="w-6 h-6 text-amber drop-shadow-sm" />
            </div>
            <DialogTitle className="text-2xl font-extrabold text-primary-foreground">
              Solicitar Vacaciones
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm mt-1">
              Selecciona los días que deseas tomar de descanso
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5 bg-card max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-text-4">
            {eligibility && !eligibility.isEligible && (
              <div className="bg-amber/10 border border-amber/20 rounded-xl p-4 text-center space-y-1">
                <Hourglass className="w-6 h-6 text-amber mx-auto" />
                <p className="font-bold text-amber-ink text-sm">Aún no cumples los días mínimos</p>
                <p className="text-xs text-amber-ink">
                  Te faltan <strong>{eligibility.daysRemaining === 1 ? `${eligibility.daysRemaining} día` : `${eligibility.daysRemaining} días`}</strong> de los {eligibility.requiredDays} requeridos
                </p>
              </div>
            )}
            {eligibility && eligibility.isEligible && (
              <div className="bg-green/10 border border-green/20 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-green-ink">
                  Días disponibles: <span className="text-lg">{balance?.availableDays ?? 0}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-4 uppercase tracking-wider">Fecha Inicio</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-sm rounded-xl h-11 border-border shadow-sm hover:bg-background", !startDate && "text-text-4 font-normal")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-border" align="start">
                    <Calendar
                      mode="single" selected={startDate} onSelect={setStartDate}
                      locale={es} className="rounded-xl"
                      disabled={vacationDates}
                      modifiers={{ vacation: vacationDates }}
                      modifiersStyles={{ vacation: { backgroundColor: "color-mix(in srgb, var(--amber) 20%, transparent)", borderRadius: "100%" } }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-4 uppercase tracking-wider">Fecha Fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-sm rounded-xl h-11 border-border shadow-sm hover:bg-background", !endDate && "text-text-4 font-normal")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-border" align="start">
                    <Calendar
                      mode="single" selected={endDate} onSelect={setEndDate}
                      locale={es} className="rounded-xl"
                      disabled={vacationDates}
                      modifiers={{ vacation: vacationDates }}
                      modifiersStyles={{ vacation: { backgroundColor: "color-mix(in srgb, var(--amber) 20%, transparent)", borderRadius: "100%" } }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {startDate && endDate && (
              <div className="bg-primary/5 rounded-xl border border-primary/10 overflow-hidden">
                <div className="p-4 text-center">
                  <p className="text-sm text-text-2 mb-1">Días a solicitar:</p>
                   <p className="text-4xl font-black text-primary tracking-tight">
                    {businessDaysBetween(startDate, endDate)}
                  </p>
                </div>
                {balance && businessDaysBetween(startDate, endDate) > (balance.availableDays ?? 0) && (
                  <div className="mx-3 mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-ink bg-red/10 py-1.5 px-3 rounded-lg">
                    <ShieldAlert className="w-4 h-4" />
                    Supera tu saldo disponible de {balance.availableDays} días
                  </div>
                )}
                {selectedRangeOverlaps && (
                  <div className="mx-3 mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-ink bg-amber/10 border border-amber/20 py-2 px-3 rounded-lg">
                    <Ban className="w-4 h-4" />
                    Ya tienes una solicitud de vacaciones aprobada o pendiente en este rango
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
                className="rounded-xl h-11 text-sm border-border shadow-sm focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <div className="bg-background p-4 px-6 border-t border-border flex justify-end gap-3 rounded-b-[20px]">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-10 px-5 font-medium border-border text-text-2 hover:bg-muted hover:text-foreground">
              Cancelar
            </Button>
            <Button
              onClick={handleRequest}
              disabled={!startDate || !endDate || submitting || (eligibility && !eligibility.isEligible) || (balance && businessDaysBetween(startDate, endDate) > (balance.availableDays ?? 999)) || selectedRangeOverlaps}
              title={eligibility && !eligibility.isEligible ? `Debes completar ${eligibility.requiredDays} días en el proyecto para solicitar` : ""}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-6 font-semibold shadow-md shadow-primary/20 transition-all disabled:opacity-50"
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

