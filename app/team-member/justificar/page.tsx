"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ArrowLeft, CalendarIcon, Loader2, FileCheck, AlertCircle } from "lucide-react";
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

function JustifyAbsencePageContent() {
  const { token, hydrated, checkingAuth } = useAuthGuard(["TEAM_MEMBER"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const absenceId = searchParams.get("absenceId");
  const date = searchParams.get("date") ?? "Sin fecha";
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
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }
  if (blocked) {
    return (
      <div className="h-screen bg-muted/50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">No se puede editar</h2>
          <p className="text-zinc-600 mb-6">Solo puedes editar justificaciones en estado de Observación.</p>
          <Button onClick={() => router.push("/team-member/justificaciones")} className="bg-blue-600 hover:bg-blue-700 text-white">Volver</Button>
        </div>
      </div>
    );
  }

  const backHref = isEditMode ? "/team-member/justificaciones" : "/team-member/faltas";

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl border-border shadow-lg rounded-3xl overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-4">

          <div className="flex items-center gap-3">
            <button onClick={() => router.push(backHref)} className="text-zinc-400 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{isEditMode ? "Editar justificación" : "Justificar ausencia"}</h1>
              <p className="text-xs text-muted-foreground">{isEditMode ? "Actualice los datos de su justificación" : date}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Motivo</label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Describa el motivo de su inasistencia..."
              className="min-h-[100px] rounded-xl border-border resize-none p-3 text-sm" />
            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Sea claro para facilitar la revisión.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Documento (opcional)</label>
            <input type="file" hidden ref={fileInputRef} onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => fileInputRef.current?.click()}
              className={`w-full border-dashed border-2 p-4 rounded-2xl flex items-center gap-3 transition-all ${documentFile ? "border-emerald-200 bg-emerald-50/30" : "border-border bg-zinc-50/50 hover:border-blue-300 hover:bg-blue-50/30"}`}>
              <div className={`p-2 rounded-xl ${documentFile ? "bg-emerald-100 text-emerald-600" : "bg-card text-muted-foreground"}`}>
                {documentFile ? <FileCheck className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-muted-foreground">{documentFile ? documentFile.name : existingDocumentUrl ? "Archivo actual  toque para reemplazar" : "Adjuntar comprobante"}</p>
                <p className="text-xs text-muted-foreground">PDF, JPG o PNG (máx. 5MB)</p>
              </div>
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 h-11 rounded-xl font-semibold" onClick={() => router.push(backHref)} disabled={isSubmitting}>Cancelar</Button>
            <Button className="flex-1 h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Enviando...</> : isEditMode ? "Guardar cambios" : "Enviar justificación"}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

export default function JustifyAbsencePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <JustifyAbsencePageContent />
    </Suspense>
  );
}
