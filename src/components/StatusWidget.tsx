import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatusWidgetProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status?: "open" | "closed" | "partial";
  className?: string;
  fullWidth?: boolean;
}

export const StatusWidget = ({
  icon: Icon,
  label,
  value,
  status,
  className,
  fullWidth = false,
}: StatusWidgetProps) => {
  const statusConfig = {
    open: {
      iconBg: "bg-gradient-to-br from-green-50 to-green-100",
      iconColor: "text-green-600",
      iconRing: "ring-2 ring-green-200",
      valueColor: "text-green-600",
      cardBorder: "border-green-200/50",
      cardShadow: "shadow-green-100/50",
    },
    closed: {
      iconBg: "bg-gradient-to-br from-red-50 to-red-100",
      iconColor: "text-red-600",
      iconRing: "ring-2 ring-red-200",
      valueColor: "text-red-600",
      cardBorder: "border-red-200/50",
      cardShadow: "shadow-red-100/50",
    },
    partial: {
      iconBg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      iconColor: "text-yellow-600",
      iconRing: "ring-2 ring-yellow-200",
      valueColor: "text-yellow-600",
      cardBorder: "border-yellow-200/50",
      cardShadow: "shadow-yellow-100/50",
    },
  };

  const config = status ? statusConfig[status] : {
    iconBg: "bg-gradient-to-br from-primary/5 to-primary/10",
    iconColor: "text-primary",
    iconRing: "ring-2 ring-primary/20",
    valueColor: "text-gray-900",
    cardBorder: "border-gray-200/50",
    cardShadow: "shadow-gray-100/50",
  };

  return (
    <Card className={cn(
      "bg-white/95 backdrop-blur-sm",
      "border-2 shadow-lg hover:shadow-xl",
      "hover:scale-[1.02] hover:-translate-y-0.5",
      "transition-all duration-300 ease-out",
      "rounded-xl md:rounded-2xl",
      "p-3 md:p-5",
      config.cardBorder,
      config.cardShadow,
      className
    )}>
      {/* Na mobilu fullWidth = horizontal layout */}
      <div className={cn(
        "text-center",
        fullWidth ? "flex flex-row gap-4 items-center justify-center md:hidden" : "hidden"
      )}>
        <div className={cn(
          "rounded-xl transition-all duration-300 flex-shrink-0",
          "shadow-sm p-2",
          "h-10 w-10 flex items-center justify-center",
          config.iconBg,
          config.iconRing
        )}>
          <Icon className={cn("stroke-[2.5] h-5 w-5", config.iconColor)} />
        </div>
        <div className="flex flex-col items-start text-left">
          <div className="text-gray-600 uppercase tracking-[0.1em] font-bold text-xs">
            {label}
          </div>
          <div className={cn("font-extrabold tracking-tight text-xl", config.valueColor)}>
            {value}
          </div>
        </div>
      </div>

      {/* Desktop layout (a mobile pro non-fullWidth) - vždy stejný */}
      <div className={cn(
        "flex-col items-center text-center",
        fullWidth ? "hidden md:flex" : "flex"
      )}>
        {/* Icon - fixed height */}
        <div className={cn(
          "rounded-xl transition-all duration-300",
          "shadow-sm hover:shadow-md",
          "p-2 md:p-3",
          "h-10 w-10 md:h-14 md:w-14 flex items-center justify-center",
          config.iconBg,
          config.iconRing
        )}>
          <Icon className={cn("stroke-[2.5] h-5 w-5 md:h-7 md:w-7", config.iconColor)} />
        </div>

        {/* Label - fixed height */}
        <div className={cn(
          "text-gray-600 uppercase tracking-[0.1em] font-bold leading-tight",
          "h-[2.5rem] flex items-center justify-center mt-2",
          "text-[10px] md:text-xs"
        )}>
          {label}
        </div>

        {/* Value - fixed height */}
        <div className={cn(
          "font-extrabold tracking-tight leading-none whitespace-nowrap",
          "h-[2rem] flex items-center justify-center",
          "text-lg md:text-2xl",
          config.valueColor
        )}>
          {value}
        </div>
      </div>
    </Card>
  );
};
