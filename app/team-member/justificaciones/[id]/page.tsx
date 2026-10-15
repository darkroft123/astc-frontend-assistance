"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, ArrowLeft, FileText, Send, Pencil, History, AlertCircle, FileUp, CheckCircle, XCircle, Clock, User, Calendar, EyeOff } from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { getJustificationDetail, submitJustification } from "@/app/services/assistance.service";
import { StatusBadge } from "@/components/atoms/status-badge";
import { formatDateTime } from "@/lib/timezone";

function fmt(v?: string | null) { return formatDateTime(v); }
function fmtD(v?: string | null) {
  if (!v) return "-";
  try { return new Date(v).toLocaleDateString("es-PE", { timeZone: "America/Lima" }); } catch { return v; }
}

const dotColor: Record<string, string> = { PENDING: "var(--blue)", SUBMITTED: "var(--blue)", OBSERVATION: "var(--amber)", APPROVED: "var(--green)", REJECTED: "var(--red)" };
const historyIcon: Record<string, any> = { PENDING: FileText, SUBMITTED: Send, OBSERVATION: AlertCircle, APPROVED: CheckCircle, REJECTED: XCircle };
function eventLabel(e: any) {
  if (!e.previousStatus && (e.newStatus === "PENDING")) return "Justificación creada";
  if (!e.previousStatus && (e.newStatus === "SUBMITTED")) return "Enviada para revisión";
  if (e.previousStatus === "PENDING" && e.newStatus === "SUBMITTED") return "Enviada para revisión";
  if (e.previousStatus === "OBSERVATION" && e.newStatus === "PENDING") return "Reenviada tras corrección";
  if (e.previousStatus === "OBSERVATION" && e.newStatus === "SUBMITTED") return "Reenviada";
  if (e.newStatus === "SUBMITTED") return "Enviada para revisión";
  if (e.newStatus === "OBSERVATION") return "El Jefe de Proyecto solicitó correcciones";
  if (e.newStatus === "APPROVED") return "Aprobada por el Jefe de Proyecto";
  if (e.newStatus === "REJECTED") return "Rechazada por el Jefe de Proyecto";
  return e.newStatus || "Cambio de estado";
}

export default function JustificationDetailPage() {
  const params = useParams(); const router = useRouter(); const id = params?.id as string;
  const { hydrated, token, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || checkingAuth || !token || !id) return;
    let c = false;
    (async () => { try { setLoading(true); const r = await getJustificationDetail(token, id); if (!c) setDetail(r); } catch (e: any) { if (!c) setError(e.message); } finally { if (!c) setLoading(false); } })();
    return () => { c = true; };
  }, [hydrated, checkingAuth, token, id]);

  const handleSubmit = async () => {
    if (!token || submitting || !id) return;
    if (!confirm("¿Enviar para revisión del Jefe de Proyecto?")) return;
    try { setSubmitting(true); const r = await submitJustification(token, id); setDetail((p: any) => ({ ...p, status: r?.status, submittedAt: r?.submittedAt })); }
    catch (e: any) { alert("Error: " + e.message); }
    finally { setSubmitting(false); }
  };

  if (!hydrated || checkingAuth || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !detail) return <div className="min-h-screen flex flex-col items-center justify-center gap-3"><p className="text-text-2">{error || "Justificación no encontrada"}</p><Button variant="outline" onClick={() => router.push("/team-member/justificaciones")}>Volver</Button></div>;

  const st = detail.status;

  return (
    <div className="min-h-screen bg-transparent pb-10">
      <div className="max-w-6xl mx-auto px-4 py-5">

        {/* TOP BAR */}
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push("/team-member/justificaciones")}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-lg font-bold text-foreground">Detalle de Justificación</h1>
          <div className="ml-auto"><StatusBadge status={st} /></div>
        </div>

        {/* STATUS BANNER */}
        {st === "PENDING" && (
          <div className="p-3 mb-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-2 shadow-sm"><Clock className="w-4 h-4 text-primary" /><span className="text-sm text-primary font-medium">Enviado, esperando revisión del Jefe de Proyecto</span></div>
        )}
        {st === "OBSERVATION" && (
          <div className="flex items-center justify-between p-3 mb-4 bg-amber/10 border border-amber/20 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber" /><span className="text-sm text-amber-ink font-medium">El Jefe de Proyecto solicitó correcciones</span></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs border-amber/20 text-amber-ink hover:bg-amber/10" onClick={() => router.push(`/team-member/justificar?justificationId=${id}`)}><Pencil className="w-3 h-3 mr-1" />Editar</Button>
              <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSubmit} disabled={submitting}>{submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}Reenviar</Button>
            </div>
          </div>
        )}
        {st === "SUBMITTED" && (
          <div className="p-3 mb-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-2 shadow-sm"><Clock className="w-4 h-4 text-primary" /><span className="text-sm text-primary font-medium">Enviado, esperando revisión</span></div>
        )}
        {st === "APPROVED" && (
          <div className="p-3 mb-4 bg-green/10 border border-green/20 rounded-2xl flex items-center gap-2 shadow-sm"><CheckCircle className="w-4 h-4 text-green-ink" /><span className="text-sm text-green-ink font-medium">Aprobada, falta justificada</span></div>
        )}
        {st === "REJECTED" && (
          <div className="p-3 mb-4 bg-red/10 border border-red/20 rounded-2xl shadow-sm"><div className="flex items-center gap-2 mb-1.5"><XCircle className="w-4 h-4 text-red-ink" /><span className="text-sm font-semibold text-red-ink">Rechazada</span></div>
            {detail.comment && <p className="text-xs text-red-ink ml-6">{detail.comment}</p>}
          </div>
        )}

        {/* TWO COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* LEFT - HISTORY */}
          <div className="lg:col-span-5">
            <Card className="border border-border bg-card shadow-sm overflow-hidden h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4 shrink-0"><History className="w-3.5 h-3.5" />Historial</h3>
                <div className="flex-1 overflow-y-auto pr-1 -mr-1" style={{ maxHeight: "480px" }}>
                  {(detail.history && detail.history.length > 0 ? detail.history : [
                    { id: "0", newStatus: detail.status, changedAt: detail.submittedAt || detail.reviewedAt, comment: detail.comment, changedBy: detail.userId }
                  ]).length === 0 || (!detail.history && !detail.status) ? (
                    <p className="text-xs text-muted-foreground italic py-2">Sin historial disponible</p>
                  ) : (
                    <div className="relative pl-7">
                      <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-border rounded-full" />
                      {(detail.history && detail.history.length > 0 ? detail.history : [
                        { id: "0", newStatus: detail.status, changedAt: detail.submittedAt || detail.reviewedAt, comment: detail.comment, changedBy: detail.userId }
                      ]).map((entry: any, idx: number, arr: any[]) => {
                        const HIcon = historyIcon[entry.newStatus] || FileText;
                        const color = dotColor[entry.newStatus] || "var(--blue)";
                        const isLast = idx === arr.length - 1;
                        return (
                          <div key={entry.id || idx} className={`relative pb-4 ${isLast ? "!pb-0" : ""}`}>
                            <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm ring-2 ring-background" style={{ backgroundColor: color }}>
                              <HIcon className="w-3 h-3 text-primary-foreground" />
                            </div>
                            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-2 border-b border-border" style={{ backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}>
                                <p className="text-xs font-bold text-foreground">{eventLabel(entry)}</p>
                                <p className="text-[11px] font-semibold text-foreground font-mono">{fmt(entry.changedAt)}</p>
                              </div>
                              {entry.comment && (
                                <div className="px-3 py-2.5">
                                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{entry.comment}</p>
                                </div>
                              )}
                              {entry.changedBy && (
                                <div className="px-3 py-1.5 bg-muted/40 flex items-center gap-1.5">
                                  <User className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-[11px] font-medium text-foreground">{entry.changedBy === detail.userId ? "Tú" : "Jefe de Proyecto"}</span>
                                </div>
                              )}
                            </div>
                            {!isLast && <div className="absolute left-[-10px] top-6 bottom-0 w-0.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${color} 19%, transparent)` }} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT - DETAILS */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-5 space-y-5">
                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Fecha de Falta</p>
                    <p className="text-sm font-semibold text-foreground">{fmtD(detail.absenceDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Tipo Falta</p>
                    <p className="text-sm font-semibold text-foreground">{detail.absenceType || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{st === "PENDING" ? "Creado" : "Enviado"}</p>
                    <p className="text-sm font-semibold text-foreground">{fmt(detail.submittedAt)}</p>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Motivo / Descripción</p>
                  <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border leading-relaxed">{detail.description || "Sin descripción"}</p>
                </div>

                {/* Attachment */}
                <div className="pt-1">
                  {detail.documentUrl ? (
                    <a href={detail.documentUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                      <FileUp className="w-4 h-4" /> Ver documento adjunto
                    </a>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted/50 border border-border text-muted-foreground rounded-xl text-sm font-medium">
                      <FileUp className="w-4 h-4" /> Sin documento
                    </div>
                  )}
                </div>

                {/* Review info */}
                {detail.reviewedAt && (
                  <div className="border-t border-border pt-4 mt-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Revisado el</p>
                        <p className="text-sm font-semibold text-foreground">{fmt(detail.reviewedAt)}</p>
                      </div>
                      {detail.comment && (st === "APPROVED" || st === "OBSERVATION") && (
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Comentario</p>
                          <p className="text-xs text-foreground/80 italic">{detail.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent" onClick={() => router.push("/team-member/justificaciones")}>
                Volver a Justificaciones
              </Button>
              {st === "OBSERVATION" && (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => router.push(`/team-member/justificar?justificationId=${id}`)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />Editar justificación
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
