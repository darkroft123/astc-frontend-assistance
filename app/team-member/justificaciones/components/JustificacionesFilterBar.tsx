"use client";

import { Folder, Search, ChevronRight, RotateCw } from "lucide-react";

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
  projectFilter,
  setProjectFilter,
  projects,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  isLoading,
  onRefresh,
}: JustificacionesFilterBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-end pt-1">
      {/* Proyecto */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Proyecto</label>
        <div className="relative">
          <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-card text-foreground">
                {p.name}
              </option>
            ))}
          </select>
          <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Buscar motivo */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Buscar motivo</label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: Cita médica, Notaría..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Estado */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Estado</label>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="TODOS" className="bg-card text-foreground">Todos los estados</option>
            <option value="SUBMITTED" className="bg-card text-foreground">Enviada</option>
            <option value="APPROVED" className="bg-card text-foreground">Aprobada</option>
            <option value="OBSERVATION" className="bg-card text-foreground">Observación</option>
            <option value="REJECTED" className="bg-card text-foreground">Rechazada</option>
          </select>
          <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Action: Actualizar button */}
      <div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-xs font-medium text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
