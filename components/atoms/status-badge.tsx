import { cn } from "@/lib/utils"
import type { JustificationStatus } from "@/lib/types/attendance"

type StatusType = string

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusStyles: Record<string, string> = {
  ON_TIME: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  ON_TIME_CHECKED_OUT: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  LATE: "bg-amber-100 text-amber-800 border border-amber-200",
  LATE_CHECKED_OUT: "bg-amber-100 text-amber-800 border border-amber-200",
  EARLY: "bg-red-100 text-red-800 border border-red-200",
  EARLY_CHECKED_OUT: "bg-amber-100 text-amber-800 border border-amber-200",
  OUTSIDE_SCHEDULE: "bg-red-100 text-red-800 border border-red-200",
  OUTSIDE_SCHEDULE_CHECKED_OUT: "bg-red-100 text-red-800 border border-red-200",
  EARLY_DEPARTURE: "bg-amber-100 text-amber-800 border border-amber-200",
  CHECKED_IN: "bg-blue-100 text-blue-800 border border-blue-200",
  CHECKED_OUT: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  PRESENTE: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  FALTA: "bg-red-100 text-red-800 border border-red-200",
  TARDE: "bg-amber-100 text-amber-800 border border-amber-200",
  PENDING: "bg-amber-100 text-amber-800 border border-amber-200",
  SUBMITTED: "bg-blue-100 text-blue-800 border border-blue-200",
  OBSERVATION: "bg-orange-100 text-orange-800 border border-orange-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  REJECTED: "bg-red-100 text-red-800 border border-red-200",
  JUSTIFICADO: "bg-blue-100 text-blue-800 border border-blue-200",
  VACACIONES: "bg-purple-100 text-purple-800 border border-purple-200",
}

const statusLabels: Record<string, string> = {
  ON_TIME: "A tiempo",
  ON_TIME_CHECKED_OUT: "A tiempo (Salida)",
  LATE: "Tarde",
  LATE_CHECKED_OUT: "Tarde (Salida)",
  EARLY: "Entrada anticipada",
  EARLY_CHECKED_OUT: "Salida anticipada",
  OUTSIDE_SCHEDULE: "Fuera de horario",
  OUTSIDE_SCHEDULE_CHECKED_OUT: "Fuera de horario",
  EARLY_DEPARTURE: "Salida temprana",
  CHECKED_IN: "Entrada registrada",
  CHECKED_OUT: "Salida registrada",
  PRESENTE: "Presente",
  FALTA: "Falta",
  TARDE: "Tarde",
  PENDING: "Borrador",
  SUBMITTED: "Pendiente",
  OBSERVATION: "Observación",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  JUSTIFICADO: "Justificado",
  VACACIONES: "Vacaciones",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedKey = status ? String(status).toUpperCase() : ""
  const label = statusLabels[normalizedKey] || status || ""
  const style = statusStyles[normalizedKey] || "bg-muted text-zinc-700 border border-border"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold shadow-xs",
        style,
        className
      )}
    >
      {label}
    </span>
  )
}
