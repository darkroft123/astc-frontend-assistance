"use client";

import Link from "next/link";
import { FileText, Eye, Pencil, Send, Loader2 } from "lucide-react";
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
      <div className="md:hidden py-12 text-center text-muted-foreground text-xs rounded-2xl border border-border bg-card/60 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#A855F7]" />
        <span>Cargando justificaciones...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="md:hidden py-12 text-center text-muted-foreground text-xs rounded-2xl border border-border bg-card/60">
        No se encontraron justificaciones.
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {items.map((row) => {
        const badge = getStatusBadge(row.estado);
        const isObservation = row.estado === "OBSERVATION";

        return (
          <div
            key={row.id}
            className="rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-4 space-y-3 shadow-sm"
          >
            {/* Header: User Avatar + Name + Status Pill */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                  CM
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-xs truncate">
                    {row.userName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {row.userEmail}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>

            {/* Motivo Card Box */}
            <div className="bg-background/60 border border-border/60 rounded-xl p-3">
              <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                MOTIVO
              </span>
              <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                {row.motivo}
              </p>
              {row.comment && (
                <p className="text-[11px] text-amber-400/90 italic mt-1.5 pt-1.5 border-t border-border/40">
                  Nota: {row.comment}
                </p>
              )}
            </div>

            {/* 2-box row: Documento & Fecha */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                  DOCUMENTO
                </span>
                {row.documentUrl ? (
                  <a
                    href={row.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-purple-400 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Ver adjunto
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin documento</span>
                )}
              </div>
              <div className="bg-background/60 border border-border/60 rounded-xl p-3">
                <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block mb-1">
                  FECHA
                </span>
                <span className="text-xs font-mono font-medium text-foreground">
                  {row.fecha}
                </span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center gap-2 pt-1">
              <Link href={`/team-member/justificaciones/${row.id}`} className="flex-1">
                <button
                  type="button"
                  className="w-full h-11 rounded-xl border border-border bg-background/50 hover:bg-background text-sm font-medium text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span>Ver</span>
                </button>
              </Link>

              {isObservation && (
                <Link
                  href={`/team-member/justificar?justificationId=${row.id}`}
                  className="flex-1"
                >
                  <button
                    type="button"
                    className="w-full h-11 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </Link>
              )}

              {row.estado === "PENDING" && (
                <button
                  type="button"
                  onClick={() => onSubmit(row.id)}
                  disabled={submittingId === row.id}
                  className="h-11 px-4 rounded-xl bg-brand-gradient hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingId === row.id ? "Enviando..." : "Enviar"}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
