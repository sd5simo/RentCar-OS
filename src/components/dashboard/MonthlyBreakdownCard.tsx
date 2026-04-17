"use client";

import { Calendar } from "lucide-react";
import { cn, formatMAD } from "@/lib/utils";

interface MonthlyBreakdownCardProps {
  month: string;
  revenue: number;
  expenses: number;
  rentalCount: number;
  maxRevenue?: number;
}

export default function MonthlyBreakdownCard({
  month,
  revenue,
  expenses,
  rentalCount,
  maxRevenue = 600000,
}: MonthlyBreakdownCardProps) {
  const net = revenue - expenses;
  const isPositive = net >= 0;
  const margin = revenue > 0 ? ((net / revenue) * 100).toFixed(1) : "0.0";
  const barWidth = Math.min((revenue / maxRevenue) * 100, 100);

  return (
    <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-[#30363d] hover:shadow-card-hover transition-all duration-200 group">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#1c2130] flex items-center justify-center">
            <Calendar size={11} className="text-slate-500" />
          </div>
          <p className="text-sm font-bold text-slate-200">{month}</p>
        </div>
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
            isPositive
              ? "bg-brand-green-500/15 text-brand-green-400 border-brand-green-500/20"
              : "bg-brand-orange-500/15 text-brand-orange-400 border-brand-orange-500/20"
          )}
        >
          {isPositive ? "+" : ""}{margin}%
        </span>
      </div>

      {/* Financial rows */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Revenus</span>
          <span className="text-[12px] font-semibold text-brand-green-400">
            + {formatMAD(revenue)} MAD
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Dépenses</span>
          <span className="text-[12px] font-semibold text-brand-orange-400">
            − {formatMAD(expenses)} MAD
          </span>
        </div>
        <div className="border-t border-[#21262d] pt-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Net</span>
          <span
            className={cn(
              "text-[12px] font-bold",
              isPositive ? "text-brand-green-400" : "text-brand-orange-400"
            )}
          >
            {isPositive ? "+" : ""}
            {formatMAD(net)} MAD
          </span>
        </div>
      </div>

      {/* Progress bar + rental count */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-600">{rentalCount} locations</span>
          <span className="text-[10px] text-slate-600">
            {((revenue / maxRevenue) * 100).toFixed(0)}% max
          </span>
        </div>
        <div className="h-1 w-full bg-[#0d1117] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-green-700 to-brand-green-400 transition-all duration-500 group-hover:opacity-100 opacity-70"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
