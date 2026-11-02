"use client";

import { Search, ChevronDown, RotateCw } from "lucide-react";

interface JustificacionesFilterBarProps {
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
    <div className="p-4 sm:p-5 border-b border-border/80 bg-card">
      {/* Desktop Layout (sm and up) */}
      <div className="hidden sm:flex items-end justify-between gap-4">
        {/* BUSCAR MOTIVO */}
        <div className="space-y-1.5 flex-1 max-w-xl">
          <label className="text-[10.5px] font-mono uppercase tracking-wider font-semibold text-muted-foreground block">
            BUSCAR MOTIVO
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: Médico, Personal..."
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground shadow-2xs"
            />
          </div>
        </div>

        {/* FILTRAR ESTADO & ACTUALIZAR */}
        <div className="flex items-end gap-2.5">
          <div className="space-y-1.5 w-48">
            <label className="text-[10.5px] font-mono uppercase tracking-wider font-semibold text-muted-foreground block">
              FILTRAR ESTADO
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-11 px-3.5 pr-8 rounded-xl border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer shadow-2xs"
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
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-11 px-4 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs shrink-0"
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

      {/* Mobile Layout (< sm, matching container1.png) */}
      <div className="sm:hidden space-y-3">
        {/* Buscar motivo */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-3 block">
            Buscar motivo
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: Médico, Personal..."
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground shadow-2xs"
            />
          </div>
        </div>

        {/* Filtrar estado row */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-3 block">
            Filtrar estado
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-11 px-3.5 pr-8 rounded-xl border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer shadow-2xs"
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
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="w-11 h-11 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Actualizar"
            >
              <RotateCw
                className={`w-4 h-4 ${
                  isLoading ? "animate-spin text-primary" : "text-muted-foreground"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
