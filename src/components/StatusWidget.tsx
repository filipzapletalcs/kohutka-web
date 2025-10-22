import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatusWidgetProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status?: "open" | "closed" | "partial";
  className?: string;
}

export const StatusWidget = ({
  icon: Icon,
  label,
  value,
  status,
  className,
}: StatusWidgetProps) => {
  const statusColors = {
    open: "text-green-500",
    closed: "text-red-500",
    partial: "text-yellow-500",
  };

  return (
    <Card className={cn("glass p-4 hover:scale-105 transition-transform duration-300", className)}>
      <div className="flex flex-col items-center text-center space-y-2">
        <Icon className={cn("h-8 w-8", status ? statusColors[status] : "text-primary")} />
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div className={cn(
          "text-lg font-bold",
          status ? statusColors[status] : "text-foreground"
        )}>
          {value}
        </div>
      </div>
    </Card>
  );
};
