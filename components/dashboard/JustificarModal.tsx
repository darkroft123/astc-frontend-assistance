"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Clock, Upload, FileCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import {
  listAbsences, saveJustification, submitJustification,
} from "@/app/services/assistance.service";

interface AbsenceRow {
  id: string;
  date: string;
  type: string;
  justified: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JustificarModal({ open, onOpenChange }: Props) {
  const { token } = useAuth();
  const { project } = useUserProject();

  const [absences, setAbsences] = useState<AbsenceRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState<AbsenceRow | null>(null);

  const [reason, setReason] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAbsences = useCallback(async () => {
    if (!token || !project) return;
    setLoadingList(true);
    try {
      const result = await listAbsences(token, {
        page: 0,
        size: 50,
        projectId: project.id,
        justified: false,
      });
      setAbsences(result?.items ?? []);
    } catch {
      setAbsences([]);
    } finally {
      setLoadingList(false);
    }
  }, [token, project]);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setReason("");
      setDocumentFile(null);
      setDone(false);
      loadAbsences();
    }
  }, [open, loadAbsences]);

  function handlePick(absence: AbsenceRow) {
    setSelected(absence);
    setReason("");
    setDocumentFile(null);
    setDone(false);
  }

  function handleBack() {
    setSelected(null);
    setReason("");
    setDocumentFile(null);
  }

  async function handleSubmit() {
    if (!token || !selected) return;
    if (!reason.trim()) return alert("Ingrese el motivo de la justificación");
    setSubmitting(true);
    try {
      const fileBase64 = documentFile ? await fileToBase64(documentFile) : null;
      const saved = await saveJustification(token, {
        absenceId: selected.id,
        description: reason,
        fileBase64,
      });
      if (saved?.id) {
        await submitJustification(token, saved.id);
      }
      setDone(true);
      setAbsences((prev) => prev.filter((a) => a.id !== selected.id));
    } catch {
      alert("Error al enviar. Intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
  }

  const typeLabel: Record<string, string> = {
    FALTA_AUTOMATICA: "Falta Automática",
    UNJUSTIFIED: "Sin justificar",
    FALTA: "Falta",
    TARDE: "Tardanza",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber" />
            {selected ? "Justificar ausencia" : "Faltas pendientes"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? `${selected.date} — ${typeLabel[selected.type] || selected.type}`
              : "Seleccione una falta para justificar"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {done ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="rounded-full bg-green/10 p-3">
                <CheckCircle2 className="w-8 h-8 text-green-ink" />
              </div>
              <p className="text-sm font-semibold text-foreground">Enviada correctamente</p>
              <p className="text-xs text-muted-foreground text-center">
                Tu justificación será revisada por tu supervisor.
              </p>
              {absences.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => { setDone(false); setSelected(null); }}>
                  Justificar otra
                </Button>
              )}
            </div>
          ) : selected ? (
            <div className="space-y-4 py-1">
              <Button
                variant="ghost" size="sm"
                className="text-muted-foreground -ml-2 gap-1"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" /> Volver a la lista
              </Button>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Motivo</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describa el motivo de su inasistencia..."
                  className="min-h-[90px] rounded-xl border-border resize-none p-3 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Documento (opcional)</label>
                <input
                  type="file" hidden ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-dashed border-2 p-3 rounded-2xl flex items-center gap-3 transition-all ${
                    documentFile
                      ? "border-green/20 bg-green/10"
                      : "border-border bg-inset hover:border-primary/30 hover:bg-primary/10"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${documentFile ? "bg-green/10 text-green-ink" : "bg-card text-muted-foreground"}`}>
                    {documentFile ? <FileCheck className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-muted-foreground">
                      {documentFile ? documentFile.name : "Adjuntar comprobante"}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, JPG o PNG (máx. 5MB)</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-1">
              {loadingList ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : absences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green" />
                  <p className="text-sm text-muted-foreground">No tienes faltas pendientes</p>
                </div>
              ) : (
                absences.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handlePick(a)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-amber/30 hover:bg-amber/10 transition-all text-left"
                  >
                    <div className="p-2 rounded-xl bg-amber/10 text-amber-ink shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.date}</p>
                      <p className="text-xs text-muted-foreground">{typeLabel[a.type] || a.type}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-ink shrink-0">JUSTIFICAR</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {selected && !done && (
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              onClick={handleSubmit}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Enviando...</>
              ) : (
                "Enviar justificación"
              )}
            </Button>
          )}
          {(!selected || done) && (
            <Button variant="outline" className="w-full rounded-xl" onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
