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
    <Card className="w-full h-full min-h-[295px] border border-border dark:border-white/10 rounded-2xl shadow-xs bg-card dark:bg-[#12141F] overflow-hidden flex flex-col justify-between">
      <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
        <div>
          <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">
            Acciones rápidas
          </h3>
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            Gestión de tu asistencia personal
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 my-auto">
          {/* Button 1: Registrar asistencia */}
          <button
            onClick={() => router.push("/team-member/registrar")}
            className="w-full h-[64px] sm:h-[72px] p-3.5 sm:p-4 rounded-xl border border-border dark:border-white/10 bg-background/50 dark:bg-white/[0.02] hover:bg-muted/50 dark:hover:bg-white/5 transition-all text-left flex items-center gap-3 group cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-sans font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
              {isEntryDone ? "Marcar salida" : "Registrar asistencia"}
            </span>
          </button>

          {/* Button 2: Justificar falta (Highlighted with amber border and solid yellow circle badge) */}
          <button
            onClick={() => router.push("/team-member/justificar")}
            className="w-full h-[64px] sm:h-[72px] p-3.5 sm:p-4 rounded-xl border border-amber-500/50 bg-background/50 dark:bg-white/[0.02] hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="font-sans font-semibold text-xs sm:text-sm text-foreground group-hover:text-amber-400 transition-colors leading-tight">
                Justificar falta
              </span>
            </div>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#EAB308] text-black font-extrabold text-xs flex items-center justify-center shrink-0 ml-1 shadow-xs">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Button 3: Ver faltas */}
          <button
            onClick={() => router.push("/team-member/faltas")}
            className="w-full h-[64px] sm:h-[72px] p-3.5 sm:p-4 rounded-xl border border-border dark:border-white/10 bg-background/50 dark:bg-white/[0.02] hover:bg-muted/50 dark:hover:bg-white/5 transition-all text-left flex items-center gap-3 group cursor-pointer shadow-2xs"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-sans font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
              Ver faltas
            </span>
          </button>

          {/* Button 4: Ver historial */}
          <button
            onClick={() => router.push("/team-member/asistencias")}
            className="w-full h-[64px] sm:h-[72px] p-3.5 sm:p-4 rounded-xl border border-border dark:border-white/10 bg-background/50 dark:bg-white/[0.02] hover:bg-muted/50 dark:hover:bg-white/5 transition-all text-left flex items-center gap-3 group cursor-pointer shadow-2xs"
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
