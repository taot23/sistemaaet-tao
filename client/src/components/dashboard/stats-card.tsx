import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  subtitle?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 mb-1">{title}</p>
            <h3 className="text-2xl font-semibold text-neutral-600">{value}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-neutral-100">
          {trend ? (
            <p className={`text-sm flex items-center ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 mr-1 ${trend.positive ? '' : 'rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              {trend.value}
            </p>
          ) : subtitle ? (
            <p className="text-sm text-neutral-500">{subtitle}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
