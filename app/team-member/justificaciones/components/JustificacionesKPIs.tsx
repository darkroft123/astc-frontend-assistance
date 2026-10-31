"use client";

import { FileText, Clock, CheckCircle2, TrendingUp } from "lucide-react";

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
      {/* Card 1: Total */}
      <div className="rounded-2xl border border-border bg-card dark:bg-[#101322] dark:border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between shadow-xs min-h-[96px] sm:min-h-[104px] transition-all">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl border border-border/80 dark:border-white/10 bg-muted/60 dark:bg-white/5 flex items-center justify-center text-muted-foreground shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Total</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground leading-none">{total}</p>
        </div>
      </div>

      {/* Card 2: Aprobadas */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-[#101322] dark:border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between shadow-xs min-h-[96px] sm:min-h-[104px] transition-all">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Aprobadas</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground leading-none">{aprobadas}</p>
        </div>
      </div>

      {/* Card 3: Pendientes */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-[#101322] dark:border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between shadow-xs min-h-[96px] sm:min-h-[104px] transition-all">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Pendientes</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground leading-none">{pendientes}</p>
        </div>
      </div>

      {/* Card 4: % Aprob. */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-gradient-to-br dark:from-[#2A1B4E]/40 dark:to-[#171A2E]/60 dark:border-[#8B5CF6]/30 p-4 sm:p-5 flex flex-col justify-between shadow-xs min-h-[96px] sm:min-h-[104px] transition-all">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-500 dark:text-[#C084FC] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xs text-purple-600 dark:text-[#C084FC] font-semibold">% Aprob.</p>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground leading-none">{porcentaje}%</p>
        </div>
      </div>
    </div>
  );
}
