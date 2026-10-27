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
    <div className="flex items-center justify-between pt-1 px-1">
      <span className="text-xs text-muted-foreground font-medium">
        {total} solicitud{total === 1 ? "" : "es"}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrevPage}
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground font-medium px-1">
          Página {page} de {maxPages}
        </span>
        <button
          type="button"
          disabled={page >= maxPages}
          onClick={onNextPage}
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
