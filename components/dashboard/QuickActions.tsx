"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle, LogOut, BarChart3, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { getTodayAttendance } from "@/app/services/assistance.service";
import { JustificarModal } from "./JustificarModal";

export function QuickActions() {
  const router = useRouter();
  const { token } = useAuth();
  const { project } = useUserProject();

  const [isEntryDone, setIsEntryDone] = useState(false);
  const [showJustificar, setShowJustificar] = useState(false);

  useEffect(() => {
    if (!token || !project) return;
    getTodayAttendance(token, project.id).then((att) => {
      if (att?.checkIn && !att?.checkOut) setIsEntryDone(true);
    });
  }, [token, project]);

  return (
    <>
      <Card className="w-full h-full border border-border rounded-[16px] shadow-sm bg-card">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div>
            <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">
              Acciones Rápidas
            </h3>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              Gestión de asistencia personal y solicitudes
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 mt-4 flex-1 items-stretch">
            {/* Primary Action Button (Registrar / Marcar Entrada o Salida) */}
            <button
              onClick={() => router.push("/team-member/registrar")}
              className={`h-24 sm:h-28 w-full justify-center text-sm font-semibold rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                isEntryDone
                  ? "bg-green hover:bg-green/90 text-primary-foreground border border-transparent"
                  : "bg-brand-gradient hover:opacity-95 text-primary-foreground border border-transparent"
              }`}
            >
              {isEntryDone ? (
                <LogOut className="w-6 h-6 shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 shrink-0" />
              )}
              <span className="font-sans font-bold text-sm tracking-tight">
                {isEntryDone ? "Marcar Salida" : "Marcar Entrada"}
              </span>
            </button>

            {/* Justificar */}
            <button
              onClick={() => setShowJustificar(true)}
              className="h-24 sm:h-28 w-full justify-center text-sm font-semibold bg-amber/10 hover:bg-amber/15 border border-amber/20 text-amber-ink rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Clock className="w-6 h-6 shrink-0" />
              <span className="font-sans font-bold text-sm tracking-tight">
                Justificar
              </span>
            </button>

            {/* Ver Faltas */}
            <button
              onClick={() => router.push("/team-member/faltas")}
              className="h-24 sm:h-28 w-full justify-center text-sm font-semibold bg-red/10 hover:bg-red/15 border border-red/20 text-red-ink rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <XCircle className="w-6 h-6 shrink-0" />
              <span className="font-sans font-bold text-sm tracking-tight">
                Ver Faltas
              </span>
            </button>

            {/* Ver Asistencias */}
            <button
              onClick={() => router.push("/team-member/asistencias")}
              className="h-24 sm:h-28 w-full justify-center text-sm font-semibold bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <BarChart3 className="w-6 h-6 shrink-0" />
              <span className="font-sans font-bold text-sm tracking-tight">
                Historial
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
      <JustificarModal open={showJustificar} onOpenChange={setShowJustificar} />
    </>
  );
}