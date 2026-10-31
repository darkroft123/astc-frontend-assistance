"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface JustificacionesPaginationProps {
  total: number;
  page: number;
  totalPages?: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function JustificacionesPagination({
  total,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
}: JustificacionesPaginationProps) {
  const maxPages = totalPages ?? Math.max(1, Math.ceil(total / 5));

  return (
    <div className="flex items-center justify-between p-4 sm:p-5 border-t border-border/80 bg-card">
      <span className="text-xs text-muted-foreground font-medium">
        Página {page} de {maxPages}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={onPrevPage}
            className="w-8 h-8 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-30 cursor-pointer hover:bg-muted/50 transition-colors shadow-2xs"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={page >= maxPages}
            onClick={onNextPage}
            className="w-8 h-8 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-30 cursor-pointer hover:bg-muted/50 transition-colors shadow-2xs"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs font-mono text-muted-foreground font-medium">
          {total} registro{total === 1 ? "" : "s"} total{total === 1 ? "" : "es"}
        </span>
      </div>
    </div>
  );
}
