import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: "green" | "red" | "amber" | "blue" | "zinc";
  className?: string;
};

export function SubMetricCard({ label, value, icon, color = "zinc", className }: MetricCardProps) {
  const colorStyles = {
    green: {
      card: "border-green/20 bg-green/5 dark:bg-[#101322] dark:border-white/[0.08]",
      iconBox: "text-green bg-green/10 border-green/20 dark:bg-green/15 dark:border-green/30",
      value: "text-foreground",
      label: "text-green-ink dark:text-green-400 font-semibold",
    },
    red: {
      card: "border-red/20 bg-red/5 dark:bg-[#101322] dark:border-white/[0.08]",
      iconBox: "text-red bg-red/10 border-red/20 dark:bg-red/15 dark:border-red/30",
      value: "text-foreground",
      label: "text-red-ink dark:text-red-400 font-semibold",
    },
    amber: {
      card: "border-amber/20 bg-amber/5 dark:bg-[#101322] dark:border-white/[0.08]",
      iconBox: "text-amber bg-amber/10 border-amber/20 dark:bg-amber/15 dark:border-amber/30",
      value: "text-foreground",
      label: "text-amber-ink dark:text-amber-400 font-semibold",
    },
    blue: {
      card: "border-primary/20 bg-primary/5 dark:bg-gradient-to-br dark:from-[#2A1B4E]/40 dark:to-[#171A2E]/60 dark:border-[#8B5CF6]/30",
      iconBox: "text-primary bg-primary/10 border-primary/20 dark:bg-primary/20 dark:border-primary/40",
      value: "text-foreground",
      label: "text-primary dark:text-[#C084FC] font-semibold",
    },
    zinc: {
      card: "border-border bg-card dark:bg-[#101322] dark:border-white/[0.08]",
      iconBox: "text-muted-foreground bg-muted/60 dark:bg-white/5 border-border dark:border-white/10",
      value: "text-foreground",
      label: "text-muted-foreground font-medium",
    },
  };

  const current = colorStyles[color] || colorStyles.zinc;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all",
        current.card,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div
          className={cn(
            "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0",
            current.iconBox
          )}
        >
          {icon}
        </div>
        <span className={cn("text-xs font-semibold tracking-tight", current.label)}>
          {label}
        </span>
      </div>
      <div className="mt-1">
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
          {value}
        </p>
      </div>
    </div>
  );
}
