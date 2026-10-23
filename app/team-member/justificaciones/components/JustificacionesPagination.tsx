"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface JustificacionesPaginationProps {
  total: number;
  page: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function JustificacionesPagination({
  total,
  page,
  onPrevPage,
  onNextPage,
}: JustificacionesPaginationProps) {
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
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground font-medium px-1">
          Página 1 de 1
        </span>
        <button
          type="button"
          disabled
          onClick={onNextPage}
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
