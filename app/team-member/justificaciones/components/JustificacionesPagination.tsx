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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 border-t border-border/80 bg-card">
      {/* On mobile: record count on left; on desktop: page indicator on left */}
      <div className="hidden sm:flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-medium">
          Página {page} de {maxPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={onPrevPage}
            className="w-8 h-8 rounded-xl border border-border/80 bg-card flex items-center justify-center text-muted-foreground disabled:opacity-30 cursor-pointer hover:bg-muted/50 transition-colors shadow-2xs"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={page >= maxPages}
            onClick={onNextPage}
            className="w-8 h-8 rounded-xl border border-border/80 bg-card flex items-center justify-center text-muted-foreground disabled:opacity-30 cursor-pointer hover:bg-muted/50 transition-colors shadow-2xs"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile row: matching container1.png */}
      <div className="flex sm:hidden items-center justify-between w-full">
        <span className="text-xs font-mono text-muted-foreground font-medium">
          {total} registro{total === 1 ? "" : "s"} total{total === 1 ? "" : "es"}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={onPrevPage}
            className="w-8 h-8 rounded-xl border border-border/80 bg-card flex items-center justify-center text-muted-foreground disabled:opacity-30 cursor-pointer hover:bg-muted/50 transition-colors shadow-2xs"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Página {page} de {maxPages}
          </span>
          <button
            type="button"
            disabled={page >= maxPages}
            onClick={onNextPage}
            className="w-8 h-8 rounded-xl border border-border/80 bg-card flex items-center justify-center text-muted-foreground disabled:opacity-30 cursor-pointer hover:bg-muted/50 transition-colors shadow-2xs"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop total count on right */}
      <div className="hidden sm:block">
        <span className="text-xs font-mono text-muted-foreground font-medium">
          {total} registro{total === 1 ? "" : "s"} total{total === 1 ? "" : "es"}
        </span>
      </div>
    </div>
  );
}
