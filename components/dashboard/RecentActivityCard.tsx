"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface AttendanceRecordSummary {
  dayName: string;
  timesText: string;
  durationText: string;
  status: "Presente" | "Pendiente" | "Falta";
}

interface RecentActivityCardProps {
  shiftText?: string;
  records?: AttendanceRecordSummary[];
}

export function RecentActivityCard({
  shiftText = "Horario regular",
  records = [],
}: RecentActivityCardProps) {
  const router = useRouter();

  return (
    <Card className="w-full border border-border/70 rounded-2xl shadow-sm bg-card">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">
              Últimos registros
            </h3>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              {shiftText}
            </p>
          </div>
          <Link
            href="/team-member/asistencias"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver todo
          </Link>
        </div>

        <div className="divide-y divide-border/60">
          {records.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Sin registros de asistencia recientes.
            </p>
          ) : (
            records.map((rec, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1">
                <div>
                  <p className="font-sans font-semibold text-xs text-foreground">
                    {rec.dayName}
                  </p>
                  <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                    {rec.timesText}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {rec.durationText}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      rec.status === "Presente"
                        ? "bg-green/10 text-green border-green/20"
                        : rec.status === "Pendiente"
                        ? "bg-amber/10 text-amber border-amber/20"
                        : "bg-red/10 text-red border-red/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        rec.status === "Presente"
                          ? "bg-green"
                          : rec.status === "Pendiente"
                          ? "bg-amber"
                          : "bg-red"
                      }`}
                    />
                    {rec.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
