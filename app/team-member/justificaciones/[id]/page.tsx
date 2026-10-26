"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import {
  Loader2,
  ChevronLeft,
  FileText,
  Send,
  Pencil,
  History,
  AlertCircle,
  Clock,
  Calendar,
  Folder,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
} from "lucide-react";
function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    const [datePart, timePart] = value.includes("T") ? value.split("T") : value.split(" ");
    if (!datePart) return value;
    const d = new Date(datePart + "T12:00:00Z");
    if (Number.isNaN(d.getTime())) return value;
    const dateStr = d.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
    if (!timePart) return dateStr;
    const [h, m] = timePart.split(":");
    const hour = parseInt(h) || 0;
    const min = parseInt(m) || 0;
    const ampm = hour >= 12 ? "p. m." : "a. m.";
    const h12 = hour % 12 || 12;
    return `${dateStr} · ${h12}:${String(min).padStart(2, "0")} ${ampm}`;
  } catch {
    return value;
  }
}

function eventLabel(e: any) {
  if (!e.previousStatus && e.newStatus === "PENDING") return "Justificación creada";
  if (!e.previousStatus && e.newStatus === "SUBMITTED") return "Enviada para revisión";
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
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const { hydrated, token, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!hydrated || checkingAuth) return;
    if (!token || !id) {
      setDetail(null);
      return;
    }
    let isCurrent = true;
    (async () => {
      try {
        setLoading(true);
        const r = await getJustificationDetail(token, id);
        if (isCurrent) {
          setDetail(r || null);
        }
      } catch {
        if (isCurrent) {
          setDetail(null);
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    })();
    return () => {
      isCurrent = false;
    };
  }, [hydrated, checkingAuth, token, id]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = async () => {
    if (!token || submitting || !id) return;
    if (!confirm("¿Enviar para revisión del Jefe de Proyecto?")) return;
    try {
      setSubmitting(true);
      const r = await submitJustification(token, id);
      setDetail((p: any) => ({
        ...p,
        status: r?.status || "SUBMITTED",
        submittedAt: r?.submittedAt || new Date().toISOString(),
      }));
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentJustification = detail;
  const st = currentJustification?.status || "SUBMITTED";
  const isApproved = st === "APPROVED";
  const isRejected = st === "REJECTED";
  const isObservation = st === "OBSERVATION";
  const isPending = st === "PENDING" || st === "SUBMITTED";

  const statusBadge = useMemo(() => {
    if (isApproved) {
      return {
        label: "Aprobada",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dot: "bg-emerald-400",
      };
    }
    if (isRejected) {
      return {
        label: "Rechazada",
        color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        dot: "bg-rose-400",
      };
    }
    if (isObservation) {
      return {
        label: "Observada",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        dot: "bg-amber-400",
      };
    }
    return {
      label: "Enviada",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      dot: "bg-blue-400",
    };
  }, [isApproved, isRejected, isObservation]);

  if (!hydrated || checkingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground text-sm">Justificación no encontrada</p>
        <Link
          href="/team-member/justificaciones"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C084FC] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a justificaciones
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Bell */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/team-member/justificaciones"
          className="inline-flex items-center gap-1.5 text-base font-bold text-[#C084FC] hover:text-purple-300 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          <span>Justificaciones</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* ID Badge Pill */}
          <button
            type="button"
            onClick={handleCopyId}
            className="h-8 px-2.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copiar ID"
          >
            <span>ID {id ? id.slice(0, 8) : "just-001"}...</span>
            {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* CARD 1: Status Hero Banner */}
      <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  Falta justificada · {currentJustification.absenceType || "Cita médica"}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                {currentJustification.absenceType || "MOTIVO_MEDICO"}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed pt-1">
          {currentJustification.description || "Sin descripción proporcionada."}
        </p>
      </div>

      {/* 2-COLUMN DETAILS GRID (1 col mobile, 2 cols desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
        {/* LEFT COLUMN: Información + Documento */}
        <div className="space-y-5 sm:space-y-6">
          {/* CARD 2: Información de la Justificación */}
          <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Información de la justificación
            </h2>

            <div className="space-y-3.5">
              {/* Proyecto */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-purple-500/25 bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    PROYECTO
                  </p>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-950/40 text-purple-300 border border-purple-800/40 text-xs font-semibold mt-0.5">
                    {currentJustification.projectName || "testo6"}
                  </span>
                </div>
              </div>

              {/* Fecha de Falta */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    FECHA DE FALTA
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-foreground mt-0.5">
                    {currentJustification.absenceDate
                      ? new Date(currentJustification.absenceDate + "T12:00:00Z").toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "02 sep 2026"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Enviada el {formatDate(currentJustification.submittedAt || "2026-09-02T09:15:00Z")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Documento Adjunto */}
          <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Documento adjunto
            </h2>

            {currentJustification.documentUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        Comprobante_medico.pdf
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Constancia médica oficial · Documento PDF
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="h-10 px-3 rounded-xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#1c2238] hover:bg-muted dark:hover:bg-[#252c48] text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {showPreview ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span>{showPreview ? "Ocultar" : "Ver"}</span>
                    </button>
                    <a
                      href={currentJustification.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </a>
                  </div>
                </div>

                {showPreview && (
                  <div className="rounded-xl overflow-hidden border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Vista previa activa de <span className="font-semibold text-foreground">Comprobante_medico.pdf</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border dark:border-[#1E2335] bg-background/50 dark:bg-[#141829]/50 p-6 text-center space-y-1.5">
                <FileText className="w-7 h-7 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-semibold text-foreground">Sin documento adjunto</p>
                <p className="text-[11px] text-muted-foreground">
                  No se incluyó comprobante externo en esta solicitud.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Historial + Estado / Acciones */}
        <div className="space-y-5 sm:space-y-6">
          {/* CARD 4: Historial de Cambios */}
          <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <span>Historial de cambios</span>
            </h2>

            <div className="space-y-3">
              {(currentJustification.history && currentJustification.history.length > 0
                ? currentJustification.history
                : [
                    {
                      id: "hist-1",
                      newStatus: currentJustification.status || "SUBMITTED",
                      changedAt: currentJustification.submittedAt || "2026-09-02T09:15:00Z",
                      comment: "Solicitud enviada para revisión del Jefe de Proyecto.",
                    },
                  ]
              ).map((entry: any, idx: number) => (
                <div key={entry.id || idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <div className="flex-1 bg-background dark:bg-[#141829] border border-border dark:border-[#1E2335] rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{eventLabel(entry)}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {formatDate(entry.changedAt)}
                      </p>
                    </div>
                    {entry.comment && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {entry.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 5: Estado de la Revisión y Acciones */}
          <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#101322] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Estado de la solicitud
            </h2>

            {isRejected && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <XCircle className="w-4 h-4" />
                  <span>Rechazada por el Jefe de Proyecto</span>
                </div>
                {currentJustification.comment && (
                  <p className="mt-1 text-foreground/80">{currentJustification.comment}</p>
                )}
              </div>
            )}

            {isApproved && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aprobada, falta justificada</span>
                </div>
                {currentJustification.comment && (
                  <p className="mt-1 text-foreground/80">{currentJustification.comment}</p>
                )}
              </div>
            )}

            {isPending && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Enviada para revisión</span>
                </div>
                <p className="text-muted-foreground mt-1">
                  Tu justificación está pendiente de evaluación por el Jefe de Proyecto.
                </p>
              </div>
            )}

            {isObservation && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Correcciones solicitadas por el Jefe de Proyecto</span>
                  </div>
                  {currentJustification.comment && (
                    <p className="mt-1 text-foreground/90 font-medium">
                      "{currentJustification.comment}"
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => router.push(`/team-member/justificar?justificationId=${id}`)}
                    className="h-10 px-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar justificación</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="h-10 px-5 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 stroke-[2]" />
                    )}
                    <span>{submitting ? "Reenviando..." : "Reenviar"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
