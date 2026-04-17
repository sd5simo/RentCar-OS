"use client";

import { AlertTriangle, Wrench, Shield, FileText, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { VehicleAlert } from "@/types";

const ALERT_ICONS: Record<string, React.ReactNode> = {
  OIL_CHANGE: <Wrench size={10} />,
  TECHNICAL_INSPECTION: <FileText size={10} />,
  INSURANCE: <Shield size={10} />,
  VIGNETTE: <FileText size={10} />,
};

interface VehicleAlertBadgesProps {
  alerts: VehicleAlert[];
  maxVisible?: number;
}

export default function VehicleAlertBadges({
  alerts,
  maxVisible = 3,
}: VehicleAlertBadgesProps) {
  if (alerts.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20">
        <CheckCircle size={10} />
        RAS
      </span>
    );
  }

  const visible = alerts.slice(0, maxVisible);
  const overflow = alerts.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((alert, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
            alert.severity === "CRITICAL"
              ? "bg-red-500/15 text-red-400 border-red-500/20"
              : "bg-brand-orange-500/15 text-brand-orange-400 border-brand-orange-500/20"
          )}
          title={alert.message}
        >
          <AlertTriangle size={10} />
          {alert.message}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
          +{overflow} alerte{overflow > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
