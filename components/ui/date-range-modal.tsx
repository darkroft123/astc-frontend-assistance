"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, X, Check, ArrowRight } from "lucide-react";

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromDate: string;
  toDate: string;
  onApply: (from: string, to: string) => void;
}

export function DateRangeModal({
  isOpen,
  onClose,
  fromDate,
  toDate,
  onApply,
}: DateRangeModalProps) {
  const [tempFrom, setTempFrom] = useState(fromDate);
  const [tempTo, setTempTo] = useState(toDate);

  useEffect(() => {
    if (isOpen) {
      setTempFrom(fromDate);
      setTempTo(toDate);
    }
  }, [isOpen, fromDate, toDate]);

  if (!isOpen) return null;

  const formatDateStr = (d: Date) => d.toISOString().split("T")[0];

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setTempFrom(formatDateStr(start));
    setTempTo(formatDateStr(end));
  };

  const applyThisMonth = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    setTempFrom(formatDateStr(start));
    setTempTo(formatDateStr(today));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempFrom || !tempTo) return;
    if (tempFrom > tempTo) {
      onApply(tempTo, tempFrom);
    } else {
      onApply(tempFrom, tempTo);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-foreground tracking-tight">
                Rango personalizado
              </h2>
              <p className="font-sans text-xs text-muted-foreground">
                Selecciona fechas para filtrar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-raised text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Desde
              </label>
              <input
                type="date"
                value={tempFrom}
                onChange={(e) => setTempFrom(e.target.value)}
                required
                className="w-full bg-surface border border-border/80 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Hasta
              </label>
              <input
                type="date"
                value={tempTo}
                onChange={(e) => setTempTo(e.target.value)}
                required
                className="w-full bg-surface border border-border/80 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
              Accesos rápidos
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border/70 bg-surface hover:bg-raised text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => applyPreset(15)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border/70 bg-surface hover:bg-raised text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                15 días
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border/70 bg-surface hover:bg-raised text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                30 días
              </button>
              <button
                type="button"
                onClick={applyThisMonth}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border/70 bg-surface hover:bg-raised text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Este mes
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border/80 hover:bg-raised text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-brand-gradient hover:opacity-95 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar rango</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
