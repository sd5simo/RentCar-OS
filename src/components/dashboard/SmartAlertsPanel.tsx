"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, AlertCircle, Info, X, ChevronRight } from "lucide-react";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { cn } from "@/lib/utils";
import { useState } from "react";

const TYPE_CONFIG = {
  CRITICAL: { icon: <AlertTriangle size={13} />, border: "border-red-500/30", bg: "bg-red-500/5", text: "text-red-400", badge: "bg-red-500/15 text-red-400 border-red-500/20" },
  WARNING:  { icon: <AlertCircle size={13} />,  border: "border-brand-orange-500/30", bg: "bg-brand-orange-500/5", text: "text-brand-orange-400", badge: "bg-brand-orange-500/15 text-brand-orange-400 border-brand-orange-500/20" },
  INFO:     { icon: <Info size={13} />,          border: "border-blue-500/30", bg: "bg-blue-500/5", text: "text-blue-400", badge: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
} as const;

export default function SmartAlertsPanel({ maxItems = 5, compact = false }: { maxItems?: number; compact?: boolean }) {
  const router = useRouter();
  const alerts = useSmartAlerts();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.id)).slice(0, maxItems);
  const criticalCount = alerts.filter((a) => a.type === "CRITICAL" && !dismissed.has(a.id)).length;

  if (visible.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {criticalCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
            <AlertTriangle size={10} /> {criticalCount} critique{criticalCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map((alert) => {
        const cfg = TYPE_CONFIG[alert.type];
        return (
          <div key={alert.id} className={cn("rounded-xl border p-4 relative group", cfg.border, cfg.bg)}>
            <button 
              onClick={() => setDismissed((prev) => {
                const next = new Set(prev);
                next.add(alert.id);
                return next;
              })}
              className="absolute top-3 right-3 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <X size={12} />
            </button>
            <div className="flex items-start gap-3">
              <span className={cn("mt-0.5 flex-shrink-0", cfg.text)}>{cfg.icon}</span>
              <div className="flex-1 min-w-0 pr-4">
                <p className={cn("text-xs font-bold mb-0.5", cfg.text)}>{alert.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{alert.description}</p>
                {alert.actionHref && (
                  <button 
                    onClick={() => {
                      if (alert.actionHref) router.push(alert.actionHref);
                    }}
                    className={cn("mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors hover:opacity-80", cfg.badge)}
                  >
                    {alert.actionLabel} <ChevronRight size={9} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {alerts.length > maxItems && (
        <p className="text-xs text-slate-600 text-center">+{alerts.length - maxItems} alerte(s) supplémentaire(s)</p>
      )}
    </div>
  );
}
