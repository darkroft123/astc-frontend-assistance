"use client";

import { Search, ChevronDown, RotateCw } from "lucide-react";

interface JustificacionesFilterBarProps {
  projectFilter: string;
  setProjectFilter: (val: string) => void;
  projects: { id: string; name: string }[];
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function JustificacionesFilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  isLoading,
  onRefresh,
}: JustificacionesFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 p-4 sm:p-5 border-b border-border/80 bg-card">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 flex-1">
        {/* Buscar motivo */}
        <div className="space-y-1.5 flex-1 max-w-sm">
          <label className="text-[11px] font-mono uppercase tracking-wider font-semibold text-muted-foreground">
            BUSCAR MOTIVO
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: Médico, Personal..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground shadow-2xs"
            />
          </div>
        </div>

        {/* Filtrar estado */}
        <div className="space-y-1.5 w-full sm:w-48">
          <label className="text-[11px] font-mono uppercase tracking-wider font-semibold text-muted-foreground">
            FILTRAR ESTADO
          </label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer shadow-2xs"
            >
              <option value="TODOS" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
                Todos los estados
              </option>
              <option value="APPROVED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
                Aprobadas
              </option>
              <option value="SUBMITTED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
                Pendientes
              </option>
              <option value="OBSERVATION" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
                Observadas
              </option>
              <option value="REJECTED" className="bg-white dark:bg-[#12141F] text-neutral-900 dark:text-neutral-100">
                Rechazadas
              </option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Action: Actualizar button */}
      <div className="sm:self-end">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${
              isLoading ? "animate-spin text-primary" : "text-muted-foreground"
            }`}
          />
          <span>Actualizar</span>
        </button>
      </div>
    </div>
  );
}
