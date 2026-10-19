import { ReactNode } from "react";
import Link from "next/link";

interface MetricCardProps {
  icon: ReactNode;
  value: string | number;
  valueSuffix?: string;
  topLabel?: string;
  topLabelColor?: "green" | "amber" | "red" | "violet" | "blue";
  bottomContent?: ReactNode;
  title?: string;
  subtitle?: string;
  trend?: string;
  badge?: string;
  color?: "blue" | "emerald" | "rose" | "amber" | "violet" | "indigo" | "sky" | "green" | "red";
  href?: string;
}

const colorStyles: Record<
  string,
  { iconBg: string; badge: string; accent: string }
> = {
  emerald: {
    iconBg: "bg-green/10 border-green/20 text-green",
    badge: "bg-green/10 text-green border-green/20",
    accent: "text-green",
  },
  green: {
    iconBg: "bg-green/10 border-green/20 text-green",
    badge: "bg-green/10 text-green border-green/20",
    accent: "text-green",
  },
  amber: {
    iconBg: "bg-amber/10 border-amber/20 text-amber",
    badge: "bg-amber/10 text-amber border-amber/20",
    accent: "text-amber",
  },
  rose: {
    iconBg: "bg-red/10 border-red/20 text-red",
    badge: "bg-red/10 text-red border-red/20",
    accent: "text-red",
  },
  red: {
    iconBg: "bg-red/10 border-red/20 text-red",
    badge: "bg-red/10 text-red border-red/20",
    accent: "text-red",
  },
  blue: {
    iconBg: "bg-primary/10 border-primary/20 text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
    accent: "text-primary",
  },
  sky: {
    iconBg: "bg-primary/10 border-primary/20 text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
    accent: "text-primary",
  },
  indigo: {
    iconBg: "bg-primary/10 border-primary/20 text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
    accent: "text-primary",
  },
  violet: {
    iconBg: "bg-violet/10 border-violet/20 text-violet",
    badge: "bg-violet/10 text-violet border-violet/20",
    accent: "text-violet",
  },
};

const topLabelColors: Record<string, string> = {
  green: "text-green",
  amber: "text-amber",
  red: "text-red",
  violet: "text-violet",
  blue: "text-blue",
};

export function MetricCard({
  icon,
  value,
  valueSuffix,
  topLabel,
  topLabelColor = "blue",
  bottomContent,
  title,
  subtitle,
  trend,
  badge,
  color = "blue",
  href,
}: MetricCardProps) {
  const normalizedColor = color === "emerald" ? "green" : color === "rose" ? "red" : color;
  const styles = colorStyles[normalizedColor] || colorStyles.blue;
  const displayBadge = badge || trend;
  const activeTopLabel = topLabel || (displayBadge ? undefined : title);

  const cardInner = (
    <div className="bg-card border border-border/70 rounded-[var(--radius-card)] p-4 sm:p-5 flex flex-col justify-between h-full shadow-sm hover:border-line-3 transition-all">
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <div className={`p-2.5 rounded-xl border shrink-0 ${styles.iconBg}`}>
          {icon}
        </div>
        {activeTopLabel && (
          <span className={`text-xs font-semibold tracking-tight ${topLabelColors[topLabelColor] || styles.accent}`}>
            {activeTopLabel}
          </span>
        )}
        {displayBadge && !activeTopLabel && (
          <span className={`font-mono text-[10.5px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full border ${styles.badge}`}>
            {displayBadge}
          </span>
        )}
      </div>

      {/* Value row */}
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-none">
            {value}
          </span>
          {valueSuffix && (
            <span className="font-sans text-xs text-muted-foreground font-normal">
              {valueSuffix}
            </span>
          )}
        </div>

        {/* Bottom row */}
        <div className="mt-3">
          {bottomContent ? (
            bottomContent
          ) : subtitle ? (
            <p className="font-sans text-xs text-muted-foreground truncate">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full cursor-pointer">{cardInner}</Link>;
  }

  return cardInner;
}
