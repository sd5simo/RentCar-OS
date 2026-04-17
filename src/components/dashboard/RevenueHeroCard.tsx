"use client";

import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueHeroCardProps {
  label: string;
  value: string;
  currency?: string;
  change?: number;
  changeLabel?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  glow?: "green" | "orange" | "none";
  size?: "sm" | "md" | "lg";
}

export default function RevenueHeroCard({
  label,
  value,
  currency,
  change,
  changeLabel,
  positive = true,
  icon,
  glow = "none",
  size = "md",
}: RevenueHeroCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-[#161b22] p-5 relative overflow-hidden transition-all duration-200 hover:shadow-card-hover",
        glow === "green" &&
          "border-brand-green-500/25 shadow-[0_0_30px_rgba(34,197,94,0.07)]",
        glow === "orange" &&
          "border-brand-orange-500/25 shadow-[0_0_30px_rgba(249,115,22,0.07)]",
        glow === "none" && "border-[#21262d]"
      )}
    >
      {/* Background gradient */}
      {glow === "green" && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green-500/5 via-transparent to-transparent pointer-events-none" />
      )}
      {glow === "orange" && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-orange-500/5 via-transparent to-transparent pointer-events-none" />
      )}

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            {label}
          </p>
          {icon && (
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                glow === "green" && "bg-brand-green-500/15 text-brand-green-400",
                glow === "orange" && "bg-brand-orange-500/15 text-brand-orange-400",
                glow === "none" && "bg-[#1c2130] text-slate-500"
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <span
            className={cn(
              "font-bold text-white tracking-tight",
              size === "lg" && "text-3xl",
              size === "md" && "text-2xl",
              size === "sm" && "text-xl"
            )}
          >
            {value}
          </span>
          {currency && (
            <span className="ml-2 text-sm font-semibold text-slate-500">
              {currency}
            </span>
          )}
        </div>

        {/* Change badge */}
        {change !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border",
                positive
                  ? "bg-brand-green-500/15 text-brand-green-400 border-brand-green-500/20"
                  : "bg-brand-orange-500/15 text-brand-orange-400 border-brand-orange-500/20"
              )}
            >
              {positive ? (
                <ArrowUpRight size={10} />
              ) : (
                <ArrowDownRight size={10} />
              )}
              {positive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-[11px] text-slate-600">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
