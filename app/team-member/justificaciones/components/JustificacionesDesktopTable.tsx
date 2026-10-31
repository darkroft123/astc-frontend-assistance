"use client";

import Link from "next/link";
import { FileText, Eye, Pencil, Send, Loader2 } from "lucide-react";
import type { TMJustificationRow } from "../page";

interface JustificacionesDesktopTableProps {
  items: TMJustificationRow[];
  getStatusBadge: (estado: string) => { label: string; cls: string; dot: string };
  onSubmit: (id: string) => void;
  submittingId: string | null;
  isLoading?: boolean;
}

export function JustificacionesDesktopTable({
  items,
  getStatusBadge,
  onSubmit,
  submittingId,
  isLoading = false,
}: JustificacionesDesktopTableProps) {
  return (
    <div className="hidden md:block w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 dark:bg-white/[0.02] text-[10.5px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
              <th className="py-3.5 px-4">FECHA</th>
              <th className="py-3.5 px-4">MOTIVO</th>
              <th className="py-3.5 px-4">DOCUMENTO</th>
              <th className="py-3.5 px-4">OBSERVACIÓN</th>
              <th className="py-3.5 px-4">ESTADO</th>
              <th className="py-3.5 px-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#A855F7]" />
                    <span>Cargando justificaciones...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                  No se encontraron justificaciones en el periodo seleccionado.
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const badge = getStatusBadge(row.estado);
                const isObservation = row.estado === "OBSERVATION";

                return (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    {/* 1. FECHA */}
                    <td className="py-4 px-4 font-mono text-xs text-foreground font-medium">
                      {row.fecha}
                    </td>

                    {/* 2. MOTIVO */}
                    <td className="py-4 px-4">
                      <span className="font-semibold text-foreground text-xs uppercase tracking-tight">
                        {row.motivo}
                      </span>
                    </td>

                    {/* 3. DOCUMENTO */}
                    <td className="py-4 px-4">
                      {row.documentUrl ? (
                        <a
                          href={row.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#A855F7] hover:underline font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver archivo</span>
                        </a>
                      ) : (
                        <span className="italic text-muted-foreground text-xs">Sin adjunto</span>
                      )}
                    </td>

                    {/* 4. OBSERVACIÓN */}
                    <td className="py-4 px-4 text-muted-foreground text-xs max-w-xs truncate">
                      {row.comment ? (
                        <span className="text-amber-500 dark:text-amber-400 font-medium">
                          {row.comment}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>

                    {/* 5. ESTADO */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>

                    {/* 6. ACCIONES */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/team-member/justificaciones/${row.id}`}>
                          <button
                            title="Ver detalle"
                            className="w-8 h-8 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        {isObservation && (
                          <Link href={`/team-member/justificar?justificationId=${row.id}`}>
                            <button
                              title="Editar justificación"
                              className="w-8 h-8 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        )}

                        {row.estado === "PENDING" && (
                          <button
                            title="Enviar para revisión"
                            onClick={() => onSubmit(row.id)}
                            disabled={submittingId === row.id}
                            className="w-8 h-8 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
