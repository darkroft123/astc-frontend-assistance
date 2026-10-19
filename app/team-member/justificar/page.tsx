"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ChevronLeft, ArrowLeft, Loader2, FileCheck, Info, Calendar as CalendarIcon, FileText, Send } from "lucide-react";
import { saveJustification, editJustification, getJustificationDetail, submitJustification } from "@/app/services/assistance.service";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDateSpanish(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObj);
  } catch {
    return dateStr;
  }
}

function JustifyAbsencePageContent() {
  const { token, hydrated, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const absenceId = searchParams.get("absenceId");
  const dateRaw = searchParams.get("date") ?? "2026-09-01";
  const formattedDate = formatDateSpanish(dateRaw);
  const justificationId = searchParams.get("justificationId");
  const isEditMode = !!justificationId;

  const [reason, setReason] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [existingDocumentUrl, setExistingDocumentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!hydrated || checkingAuth || !token || !justificationId) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await getJustificationDetail(token, justificationId);
        if (cancelled) return;
        if (detail) {
          if (detail.status !== "OBSERVATION") { setBlocked(true); return; }
          setReason(detail.description || "");
          setExistingDocumentUrl(detail.documentUrl || null);
        }
      } catch (err) { console.error(err); }
      finally { if (!cancelled) setInitialLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [hydrated, checkingAuth, token, justificationId]);

  async function handleSubmit() {
    if (!token) return;
    if (!isEditMode && !absenceId) return alert("No se encontró la falta");
    if (!reason.trim()) return alert("Ingrese el motivo de la justificación");
    setIsSubmitting(true);
    try {
      const fileBase64 = documentFile ? await fileToBase64(documentFile) : null;
      if (isEditMode) {
        await editJustification(token, justificationId, { absenceId: null, description: reason, fileBase64 });
        await submitJustification(token, justificationId);
        router.push("/team-member/justificaciones");
      } else {
        const saved = await saveJustification(token, { absenceId, description: reason, fileBase64 });
        if (saved?.id) {
          await submitJustification(token, saved.id);
        }
        router.push("/team-member/justificaciones");
      }
    } catch (err) { alert("Error al enviar. Intente nuevamente."); }
    finally { setIsSubmitting(false); }
  }

  if (!hydrated || checkingAuth || initialLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (blocked) {
    return (
      <div className="h-screen bg-transparent flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-foreground mb-2">No se puede editar</h2>
          <p className="text-text-2 mb-6">Solo puedes editar justificaciones en estado de Observación.</p>
          <Button onClick={() => router.push("/team-member/justificaciones")} className="bg-primary hover:bg-primary/90 text-primary-foreground">Volver</Button>
        </div>
      </div>
    );
  }

  const backHref = isEditMode ? "/team-member/justificaciones" : "/team-member/faltas";

  return (
    <div className="w-full max-w-[560px] mx-auto p-4 space-y-4 pb-20">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a justificaciones</span>
        </button>
      </div>

      {/* Title header with gradient icon */}
      <div className="flex items-center gap-3.5 pt-1">
        <div className="w-12 h-12 rounded-2xl bg-avatar-gradient flex items-center justify-center text-white shadow-lg shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            {isEditMode ? "Editar justificación" : "Justificar ausencia"}
          </h1>
          <p className="text-xs text-text-4 mt-0.5">
            Explica el motivo y adjunta un comprobante si lo tienes.
          </p>
        </div>
      </div>

      {/* Ausencia a justificar card */}
      <div className="rounded-2xl border border-border/80 bg-raised/60 p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
            AUSENCIA A JUSTIFICAR
          </p>
          <p className="text-sm font-bold text-foreground capitalize mt-0.5">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-5 shadow-sm">
        {/* Motivo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              Motivo <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs font-mono text-text-4">
              {reason.length}/240
            </span>
          </div>

          <Textarea
            value={reason}
            maxLength={240}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describa el motivo de su inasistencia..."
            className="min-h-[130px] rounded-xl border border-border/70 bg-field/40 resize-none p-3.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-4/60"
          />

          <p className="text-xs text-text-4">
            Sea claro y específico para facilitar la revisión.
          </p>
        </div>

        {/* Documento */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            Documento <span className="text-text-4 font-normal">(opcional)</span>
          </label>
          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-dashed border-2 p-4 rounded-xl flex items-center gap-3.5 transition-all cursor-pointer ${
              documentFile
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-border/70 bg-field/30 hover:border-primary/50 hover:bg-field/50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                documentFile
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-surface border border-border/80 text-text-4"
              }`}
            >
              {documentFile ? <FileCheck className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <p className="font-semibold text-xs sm:text-sm text-foreground">
                {documentFile
                  ? documentFile.name
                  : existingDocumentUrl
                  ? "Archivo actual — toque para reemplazar"
                  : "Adjuntar comprobante"}
              </p>
              <p className="text-[11px] text-text-4 mt-0.5">
                PDF, JPG o PNG (máx. 5 MB)
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          className="flex-1 h-12 rounded-xl font-bold text-sm bg-surface hover:bg-surface/80 border border-border text-foreground transition-all cursor-pointer"
          onClick={() => router.push(backHref)}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="flex-1 h-12 rounded-xl font-bold text-sm bg-surface hover:bg-surface/80 border border-border text-foreground transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isSubmitting || !reason.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{isEditMode ? "Guardar cambios" : "Enviar justificación"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function JustifyAbsencePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <JustifyAbsencePageContent />
    </Suspense>
  );
}
