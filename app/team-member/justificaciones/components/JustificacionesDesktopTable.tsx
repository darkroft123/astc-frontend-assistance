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
    <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-background/50 text-[10.5px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
              <th className="py-3.5 px-4">TRABAJADOR</th>
              <th className="py-3.5 px-4">MOTIVO</th>
              <th className="py-3.5 px-4">DOCUMENTO</th>
              <th className="py-3.5 px-4">FECHA</th>
              <th className="py-3.5 px-4">ESTADO</th>
              <th className="py-3.5 px-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
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
                  No se encontraron justificaciones.
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const badge = getStatusBadge(row.estado);
                const isObservation = row.estado === "OBSERVATION";

                return (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                          CM
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {row.userName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {row.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground max-w-xs truncate">
                      <span className="text-foreground/90 font-medium">{row.motivo}</span>
                      {row.comment && (
                        <p className="text-[11px] text-amber-400 italic truncate mt-0.5">
                          Obs: {row.comment}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {row.documentUrl ? (
                        <a
                          href={row.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Ver adjunto
                        </a>
                      ) : (
                        <span className="italic text-muted-foreground text-xs">Sin documento</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-foreground">
                      {row.fecha}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/team-member/justificaciones/${row.id}`}>
                          <button
                            title="Ver detalle"
                            className="w-9 h-9 rounded-xl border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </Link>

                        {isObservation && (
                          <Link href={`/team-member/justificar?justificationId=${row.id}`}>
                            <button
                              title="Editar justificación"
                              className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </Link>
                        )}

                        {row.estado === "PENDING" && (
                          <button
                            title="Enviar para revisión"
                            onClick={() => onSubmit(row.id)}
                            disabled={submittingId === row.id}
                            className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
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
