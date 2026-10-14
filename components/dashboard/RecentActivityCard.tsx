import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityItem } from "./ActivityItem";
import { useRouter } from "next/navigation";

export function RecentActivityCard() {
  const router = useRouter();

  return (
    <Card className="h-full">
      <CardContent className="p-5 h-full flex flex-col">
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Actividad reciente</h3>
          <p className="text-sm text-muted-foreground">Últimas acciones del equipo</p>
        </div>

        <div className="flex-1 space-y-3">
          <ActivityItem
            initials="JP"
            name="Juan Pérez"
            action="Subió justificación de ausencia"
            time="1h"
            color="blue"
          />
          <ActivityItem
            initials="ML"
            name="María López"
            action="Registró asistencia"
            time="3h"
            color="emerald"
          />
          <ActivityItem
            initials="CD"
            name="Carlos Díaz"
            action="Envió justificante medico"
            time="5h"
            color="amber"
          />
        </div>

        <Button
          variant="ghost"
          className="w-full mt-auto text-primary hover:bg-primary/10"
          onClick={() => router.push("/team-member/asistencias")}
        >
          Ver todo
        </Button>
      </CardContent>
    </Card>
  );
}
