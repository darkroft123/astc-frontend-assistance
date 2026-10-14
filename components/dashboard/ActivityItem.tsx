import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ActivityItemProps {
  initials: string;
  name: string;
  action: string;
  time: string;
  color: "blue" | "emerald" | "amber";
}

export function ActivityItem({ initials, name, action, time, color }: ActivityItemProps) {
  const colorMap: Record<string, string> = {
    blue: "bg-primary/10 text-primary",
    emerald: "bg-green/10 text-green-ink",
    amber: "bg-amber/10 text-amber-ink",
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback className={colorMap[color]}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{action}</p>
      </div>
      <p className="text-xs text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  );
}