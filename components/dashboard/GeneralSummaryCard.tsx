import { Card, CardContent } from "@/components/ui/card";

interface GeneralSummaryCardProps {
  selectedProject?: { name: string };
  attendanceRate?: number;
  metrics?: {
    totalAttendances: number;
    totalAbsences: number;
    pendingJustifications: number;
  };
  totalUsers?: number;
  teamMembersCount?: number;
  pmsCount?: number;
  adminsCount?: number;
  dateRangeText?: string;
  accumulatedHoursText?: string;
}

export function GeneralSummaryCard({
  selectedProject = { name: "testo6" },
  attendanceRate = 50,
  metrics,
  teamMembersCount,
  pmsCount,
  adminsCount,
  dateRangeText,
  accumulatedHoursText = "16 h 20 m",
}: GeneralSummaryCardProps) {
  const att = metrics?.totalAttendances ?? teamMembersCount ?? 2;
  const abs = metrics?.totalAbsences ?? adminsCount ?? 2;
  const pend = metrics?.pendingJustifications ?? pmsCount ?? 1;

  const total = att + abs + pend;
  const calculatedRate = attendanceRate ?? (total > 0 ? Math.round((att / total) * 100) : 50);

  const attPct = total > 0 ? Math.round((att / total) * 100) : 40;
  const absPct = total > 0 ? Math.round((abs / total) * 100) : 40;
  const pendPct = total > 0 ? 100 - attPct - absPct : 20;

  const R = 38;
  const C = 2 * Math.PI * R;

  const attLen = total > 0 ? (att / total) * C : 0.4 * C;
  const absLen = total > 0 ? (abs / total) * C : 0.4 * C;
  const pendLen = total > 0 ? (pend / total) * C : 0.2 * C;

  return (
    <Card className="h-full rounded-2xl shadow-sm overflow-hidden border border-border/70 bg-card flex flex-col justify-between">
      <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-foreground">Resumen del periodo</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dateRangeText || "5 registros entre el 01 y el 03 de septiembre"}
            </p>
          </div>
          <span className="font-semibold text-xs bg-violet/10 text-violet px-3 py-1 rounded-full border border-violet/20">
            {selectedProject?.name || "testo6"}
          </span>
        </div>

        {/* Center: Donut on Top + Breakdown Underneath */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 sm:py-3 w-full">
          {/* Donut Chart (Centered) */}
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0 my-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="11"
                className="text-muted/30"
              />

              {/* Asistencias (Green) */}
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="#34D399"
                strokeWidth="11"
                strokeDasharray={`${attLen} ${C}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Faltas (Red / Coral) */}
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="#F87171"
                strokeWidth="11"
                strokeDasharray={`${absLen} ${C}`}
                strokeDashoffset={-attLen}
                strokeLinecap="round"
              />
              {/* Pendientes (Amber) */}
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="#FBBF24"
                strokeWidth="11"
                strokeDasharray={`${pendLen} ${C}`}
                strokeDashoffset={-(attLen + absLen)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground leading-none">
                  {calculatedRate}%
                </p>
                <p className="text-[9px] tracking-[2px] text-muted-foreground font-bold mt-1 uppercase">
                  ASISTENCIA
                </p>
              </div>
            </div>
          </div>

          {/* Legend / Breakdown (Full width rows matching SVG) */}
          <div className="w-full space-y-2.5 pt-3 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] shrink-0" />
                <span className="text-foreground/90 font-medium">Asistencias</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="font-bold text-foreground">{att}</span>
                <span className="text-muted-foreground text-[11px] min-w-[32px] text-right">{attPct}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F87171] shrink-0" />
                <span className="text-foreground/90 font-medium">Faltas</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="font-bold text-foreground">{abs}</span>
                <span className="text-muted-foreground text-[11px] min-w-[32px] text-right">{absPct}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] shrink-0" />
                <span className="text-foreground/90 font-medium">Pendientes</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="font-bold text-foreground">{pend}</span>
                <span className="text-muted-foreground text-[11px] min-w-[32px] text-right">{pendPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Horas acumuladas */}
        <div className="border-t border-border/60 pt-3 mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Horas acumuladas</span>
          <span className="font-mono font-bold text-foreground text-sm tracking-wide">
            {accumulatedHoursText}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}