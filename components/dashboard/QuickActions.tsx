"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText, AlertTriangle, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { getTodayAttendance } from "@/app/services/assistance.service";

interface QuickActionsProps {
  pendingCount?: number;
}

export function QuickActions({ pendingCount = 1 }: QuickActionsProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { project } = useUserProject();
  const [isEntryDone, setIsEntryDone] = useState(false);

  useEffect(() => {
    if (!token || !project) return;
    getTodayAttendance(token, project.id)
      .then((att) => {
        if (att?.checkIn && !att?.checkOut) setIsEntryDone(true);
      })
      .catch(() => {});
  }, [token, project]);

  return (
    <Card className="w-full border border-border/80 rounded-2xl shadow-sm bg-card overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="font-sans font-bold text-lg sm:text-xl text-foreground tracking-tight">
            Acciones rápidas
          </h3>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gestión de tu asistencia personal
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Button 1: Registrar asistencia */}
          <button
            onClick={() => router.push("/team-member/registrar")}
            className="w-full min-h-[72px] sm:min-h-[80px] p-3.5 sm:p-4 rounded-xl border border-border/80 bg-surface/70 hover:bg-raised transition-all text-left flex items-center gap-3 sm:gap-3.5 group cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="font-sans font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                {isEntryDone ? "Marcar" : "Registrar"}
              </span>
              <span className="font-sans font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                {isEntryDone ? "salida" : "asistencia"}
              </span>
            </div>
          </button>

          {/* Button 2: Justificar falta (Highlighted with amber border and solid yellow circle badge) */}
          <button
            onClick={() => router.push("/team-member/justificar")}
            className="w-full min-h-[72px] sm:min-h-[80px] p-3.5 sm:p-4 rounded-xl border border-amber-500/70 bg-surface/70 hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <FileText className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-sans font-semibold text-xs sm:text-sm text-foreground group-hover:text-amber-400 transition-colors">
                  Justificar
                </span>
                <span className="font-sans font-semibold text-xs sm:text-sm text-foreground group-hover:text-amber-400 transition-colors">
                  falta
                </span>
              </div>
            </div>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#EAB308] text-black font-extrabold text-xs flex items-center justify-center shrink-0 ml-1.5 shadow-xs">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Button 3: Ver faltas */}
          <button
            onClick={() => router.push("/team-member/faltas")}
            className="w-full min-h-[72px] sm:min-h-[80px] p-3.5 sm:p-4 rounded-xl border border-border/80 bg-surface/70 hover:bg-raised transition-all text-left flex items-center gap-3 sm:gap-3.5 group cursor-pointer"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-sans font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
              Ver faltas
            </span>
          </button>

          {/* Button 4: Ver historial */}
          <button
            onClick={() => router.push("/team-member/asistencias")}
            className="w-full min-h-[72px] sm:min-h-[80px] p-3.5 sm:p-4 rounded-xl border border-border/80 bg-surface/70 hover:bg-raised transition-all text-left flex items-center gap-3 sm:gap-3.5 group cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="font-sans font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
              Ver historial
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}