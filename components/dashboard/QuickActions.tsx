"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, LogOut, BarChart3 } from "lucide-react";
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
    getTodayAttendance(token, project.id).then(att => {
      if (att?.checkIn && !att?.checkOut) setIsEntryDone(true);
    });
  }, [token, project]);

  return (
    <>
    <Card className="w-full h-full border border-border rounded-3xl shadow-sm bg-card">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div>
          <h3 className="font-bold text-lg text-foreground">
            Acciones Rápidas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestión de asistencia personal
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5 mt-4 flex-1 items-center">
          <Button
            onClick={() => router.push("/team-member/registrar")}
            className={`h-24 sm:h-28 w-full justify-center text-sm font-bold rounded-2xl flex-col gap-2 shadow-sm text-white transition-all ${
              isEntryDone
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isEntryDone ? <LogOut className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
            <span className="text-sm font-bold">{isEntryDone ? "Marcar Salida" : "Registrar"}</span>
          </Button>

          <Button
            onClick={() => setShowJustificar(true)}
            className="h-24 sm:h-28 w-full justify-center text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-2xl flex-col gap-2 shadow-sm transition-all"
          >
            <Clock className="w-6 h-6" />
            <span className="text-sm font-bold">Justificar</span>
          </Button>

          <Button
            onClick={() => router.push("/team-member/faltas")}
            className="h-24 sm:h-28 w-full justify-center text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-2xl flex-col gap-2 shadow-sm transition-all"
          >
            <XCircle className="w-6 h-6" />
            <span className="text-sm font-bold">Ver Faltas</span>
          </Button>

          <Button
            onClick={() => router.push("/team-member/asistencias")}
            className="h-24 sm:h-28 w-full justify-center text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex-col gap-2 shadow-sm transition-all"
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-sm font-bold">Ver Asistencias</span>
          </Button>
        </div>
      </CardContent>
    </Card>
    <JustificarModal open={showJustificar} onOpenChange={setShowJustificar} />
    </>
  );
}