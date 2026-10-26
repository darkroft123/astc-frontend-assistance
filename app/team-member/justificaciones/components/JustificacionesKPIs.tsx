"use client";

import { AlertTriangle, Clock, CheckCircle2, TrendingUp } from "lucide-react";

interface JustificacionesKPIsProps {
  total: number;
  pendientes: number;
  aprobadas: number;
  porcentaje: number;
}

export function JustificacionesKPIs({
  total,
  pendientes,
  aprobadas,
  porcentaje,
}: JustificacionesKPIsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {/* Card 1: Total solicitudes */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Total solicitudes</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{total}</p>
        </div>
      </div>

      {/* Card 2: Pendientes */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs text-amber-400 font-medium">Pendientes</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{pendientes}</p>
        </div>
      </div>

      {/* Card 3: Aprobadas */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-emerald-400 font-medium">Aprobadas</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{aprobadas}</p>
        </div>
      </div>

      {/* Card 4: % Aprobadas */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 flex flex-col justify-between shadow-sm min-h-[96px] sm:min-h-[104px]">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xs text-purple-400 font-medium">% Aprobadas</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{porcentaje}%</p>
        </div>
      </div>
    </div>
  );
}
