"use client";

import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatMAD } from "@/lib/utils";

interface PerformanceBannerProps {
  totalNet: number;
  totalRevenue: number;
  bestMonth: string;
  bestMonthNet: number;
  growthPct: number;
}

export default function PerformanceBanner({
  totalNet,
  totalRevenue,
  bestMonth,
  bestMonthNet,
  growthPct,
}: PerformanceBannerProps) {
  const netMargin = totalRevenue > 0 ? ((totalNet / totalRevenue) * 100).toFixed(1) : "0.0";
  const isPositive = totalNet >= 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-center gap-4",
        isPositive
          ? "border-brand-green-500/20 bg-gradient-to-r from-brand-green-500/10 via-brand-green-500/5 to-transparent"
          : "border-brand-orange-500/20 bg-gradient-to-r from-brand-orange-500/10 via-brand-orange-500/5 to-transparent"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isPositive ? "bg-brand-green-500/20" : "bg-brand-orange-500/20"
        )}
      >
        {isPositive ? (
          <Trophy size={20} className="text-brand-green-400" />
        ) : (
          <TrendingDown size={20} className="text-brand-orange-400" />
        )}
      </div>

      <div className="flex-1">
        <p
          className={cn(
            "text-sm font-bold",
            isPositive ? "text-brand-green-400" : "text-brand-orange-400"
          )}
        >
          {isPositive ? "🎉 Performance positive!" : "⚠️ Performance négative"}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Rentify-OSa généré un bénéfice net de{" "}
          <span className="text-white font-semibold">{formatMAD(totalNet)} MAD</span> — marge
          nette de{" "}
          <span
            className={cn(
              "font-semibold",
              isPositive ? "text-brand-green-400" : "text-brand-orange-400"
            )}
          >
            {netMargin}%
          </span>
          . Meilleur mois:{" "}
          <span className="text-white font-semibold">{bestMonth}</span> avec{" "}
          <span className="text-brand-green-400 font-semibold">
            +{formatMAD(bestMonthNet)} MAD
          </span>{" "}
          net.
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-[11px] text-slate-500 mb-1">Croissance annuelle</p>
        <div className="flex items-center gap-1 justify-end">
          {growthPct >= 0 ? (
            <TrendingUp size={14} className="text-brand-green-400" />
          ) : (
            <TrendingDown size={14} className="text-brand-orange-400" />
          )}
          <p
            className={cn(
              "text-lg font-bold",
              growthPct >= 0 ? "text-brand-green-400" : "text-brand-orange-400"
            )}
          >
            {growthPct >= 0 ? "+" : ""}
            {growthPct.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
