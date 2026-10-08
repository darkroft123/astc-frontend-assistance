import { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: "green" | "red" | "amber" | "blue" | "zinc";
};

export function SubMetricCard({ label, value, icon, color = "zinc" }: MetricCardProps) {
  const style =
    color === "green"
      ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
      : color === "red"
      ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400"
      : color === "amber"
      ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400"
      : color === "blue"
      ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400"
      : "bg-muted/50 border-border text-foreground dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300";

  return (
    <div
      className={`border rounded-lg px-3 py-1.5 text-center ${style} shadow-sm min-w-[88px] flex flex-col items-center justify-center transition-colors`}
    >
      <p className="text-[9px] text-muted-foreground font-medium tracking-tight">
        {label}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {icon && <div className="w-3.5 h-3.5 opacity-80">{icon}</div>}
        <p className="text-base font-bold">{value}</p>
      </div>
    </div>
  );
}
