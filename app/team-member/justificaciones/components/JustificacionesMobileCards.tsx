"use client";

import Link from "next/link";
import { Calendar as CalendarIcon, Eye, Pencil, Send, Loader2 } from "lucide-react";
import type { TMJustificationRow } from "../page";

interface JustificacionesMobileCardsProps {
  items: TMJustificationRow[];
  getStatusBadge: (estado: string) => { label: string; cls: string; dot: string };
  onSubmit: (id: string) => void;
  submittingId: string | null;
  isLoading?: boolean;
}

export function JustificacionesMobileCards({
  items,
  getStatusBadge,
  onSubmit,
  submittingId,
  isLoading = false,
}: JustificacionesMobileCardsProps) {
  if (isLoading) {
    return (
      <div className="md:hidden py-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>Cargando justificaciones...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="md:hidden py-12 text-center text-muted-foreground text-xs p-4">
        No se encontraron justificaciones en el periodo seleccionado.
      </div>
    );
  }

  return (
    <div className="md:hidden p-4 space-y-3">
      {items.map((row) => {
        const badge = getStatusBadge(row.estado);
        const isObservation = row.estado === "OBSERVATION";

        return (
          <div
            key={row.id}
            className="rounded-2xl border border-border/80 dark:border-white/10 bg-card dark:bg-[#0C0E18] p-4 space-y-3.5 shadow-xs"
          >
            {/* Top row: [ 📅 ] Date · Time on left, Status pill on right */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground">{row.fecha}</span>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>

            {/* MOTIVO section */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-wider uppercase text-purple-400 font-semibold block">
                MOTIVO
              </span>
              <p className="text-sm font-bold text-foreground">
                {row.motivo}
              </p>
            </div>

            {/* 2 boxes side-by-side: DOCUMENTO & OBSERVACIÓN */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-border/60 bg-muted/30 dark:bg-white/[0.03] p-3 space-y-1">
                <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground font-semibold block">
                  DOCUMENTO
                </span>
                {row.documentUrl ? (
                  <a
                    href={row.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline font-medium truncate block"
                  >
                    Ver archivo
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground block">Sin documento</span>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 dark:bg-white/[0.03] p-3 space-y-1">
                <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground font-semibold block">
                  OBSERVACIÓN
                </span>
                <span className="text-xs text-muted-foreground truncate block">
                  {row.comment || "Sin observación"}
                </span>
              </div>
            </div>

            {/* Full-width action button: Ver detalle */}
            <div className="pt-0.5 space-y-2">
              <Link href={`/team-member/justificaciones/${row.id}`} className="block w-full">
                <button
                  type="button"
                  className="w-full h-10 rounded-xl border border-border/80 bg-card dark:bg-[#141829] hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Ver detalle</span>
                </button>
              </Link>

              {isObservation && (
                <Link href={`/team-member/justificar?justificationId=${row.id}`} className="block w-full">
                  <button
                    type="button"
                    className="w-full h-10 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-500 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar correcciones</span>
                  </button>
                </Link>
              )}

              {row.estado === "PENDING" && (
                <button
                  type="button"
                  onClick={() => onSubmit(row.id)}
                  disabled={submittingId === row.id}
                  className="w-full h-10 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-xs font-semibold text-purple-400 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar para revisión</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
