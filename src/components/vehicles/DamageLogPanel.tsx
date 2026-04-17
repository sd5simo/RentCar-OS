"use client";

import { useState } from "react";
import { Plus, X, Wrench, CheckCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { DamageLog, DamageSeverity, DamageZone } from "@/types";

const ZONE_LABELS: Record<DamageZone, string> = {
  FRONT: "Avant",
  REAR: "Arrière",
  LEFT: "Gauche",
  RIGHT: "Droite",
  TOP: "Toit",
  INTERIOR: "Intérieur",
};

const SEVERITY_CONFIG: Record<DamageSeverity, { label: string; color: string }> = {
  MINOR: {
    label: "Mineur",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  },
  MODERATE: {
    label: "Modéré",
    color: "text-brand-orange-400 bg-brand-orange-500/10 border-brand-orange-500/20",
  },
  SEVERE: {
    label: "Grave",
    color: "text-red-400 bg-red-500/10 border-red-500/20",
  },
};

interface DamageLogPanelProps {
  vehicleId: string;
  initialLogs?: DamageLog[];
  readOnly?: boolean;
}

export default function DamageLogPanel({
  vehicleId,
  initialLogs = [],
  readOnly = false,
}: DamageLogPanelProps) {
  const [logs, setLogs] = useState<DamageLog[]>(initialLogs);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    zone: "FRONT" as DamageZone,
    description: "",
    severity: "MINOR" as DamageSeverity,
    notes: "",
  });

  const unrepairedByZone = Object.keys(ZONE_LABELS).reduce(
    (acc, zone) => {
      acc[zone as DamageZone] = logs.filter(
        (l) => l.zone === zone && !l.repaired
      ).length;
      return acc;
    },
    {} as Record<DamageZone, number>
  );

  const addLog = () => {
    if (!form.description) return;
    const newLog: DamageLog = {
      id: Math.random().toString(36).slice(2),
      vehicleId,
      description: form.description,
      severity: form.severity,
      zone: form.zone,
      repaired: false,
      detectedAt: new Date(),
      notes: form.notes || null,
      createdAt: new Date(),
      repairCost: null,
      repairedAt: null,
    };
    setLogs((prev) => [newLog, ...prev]);
    setForm({ zone: "FRONT", description: "", severity: "MINOR", notes: "" });
    setShowForm(false);
  };

  const markRepaired = (id: string) => {
    setLogs((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, repaired: true, repairedAt: new Date() } : l
      )
    );
  };

  return (
    <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench size={15} className="text-brand-orange-400" />
          <p className="text-sm font-semibold text-slate-200">Journal des dommages</p>
          {logs.filter((l) => !l.repaired).length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-orange-500/15 text-brand-orange-400 border border-brand-orange-500/20">
              {/* CORRECTION ICI : Ajout de .length */}
              {logs.filter((l) => !l.repaired).length} non réparé(s)
            </span>
          )}
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-orange-500/10 border border-brand-orange-500/20 text-brand-orange-400 hover:bg-brand-orange-500/20 transition-colors"
          >
            <Plus size={12} />
            Ajouter
          </button>
        )}
      </div>

      {/* Car zone diagram */}
      <div className="rounded-lg border border-[#21262d] bg-[#0d1117] p-5 mb-4">
        <div className="flex items-center justify-center mb-3">
          <svg viewBox="0 0 280 140" className="w-full max-w-xs opacity-60" style={{ maxHeight: 120 }}>
            {/* Car body */}
            <rect x="30" y="50" width="220" height="65" rx="14" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            {/* Cabin */}
            <rect x="75" y="25" width="130" height="45" rx="10" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            {/* Wheels */}
            <circle cx="72" cy="115" r="16" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            <circle cx="208" cy="115" r="16" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            {/* Bumpers */}
            <line x1="30" y1="72" x2="5" y2="78" stroke="#22c55e" strokeWidth="1.5" />
            <line x1="250" y1="72" x2="275" y2="78" stroke="#22c55e" strokeWidth="1.5" />
            {/* Windows */}
            <rect x="85" y="32" width="45" height="30" rx="5" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.5" />
            <rect x="150" y="32" width="45" height="30" rx="5" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(ZONE_LABELS) as [DamageZone, string][]).map(([zone, label]) => {
            const count = unrepairedByZone[zone];
            return (
              <div
                key={zone}
                className={cn(
                  "text-center py-1.5 rounded-md text-[11px] font-semibold border transition-colors",
                  count > 0
                    ? "bg-brand-orange-500/15 text-brand-orange-400 border-brand-orange-500/30"
                    : "bg-[#161b22] text-slate-600 border-[#21262d]"
                )}
              >
                {label}
                {count > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-brand-orange-500 text-white text-[10px] inline-flex items-center justify-center">
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-lg border border-brand-orange-500/20 bg-[#0d1117] p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mb-1 block">
                Zone
              </label>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value as DamageZone })}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50"
              >
                {(Object.entries(ZONE_LABELS) as [DamageZone, string][]).map(
                  ([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mb-1 block">
                Gravité
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as DamageSeverity })}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50"
              >
                <option value="MINOR">Mineur</option>
                <option value="MODERATE">Modéré</option>
                <option value="SEVERE">Grave</option>
              </select>
            </div>
          </div>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description du dommage..."
            className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-orange-500/50"
          />
          <div className="flex gap-2">
            <button
              onClick={addLog}
              className="flex-1 py-2 bg-brand-orange-600 hover:bg-brand-orange-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Enregistrer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-2 bg-[#161b22] border border-[#30363d] text-slate-400 rounded-lg hover:text-slate-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Log list */}
      {logs.length === 0 ? (
        <div className="text-center py-8 text-slate-600">
          <CheckCircle size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucun dommage enregistré</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const sev = SEVERITY_CONFIG[log.severity];
            return (
              <div
                key={log.id}
                className={cn(
                  "flex items-start justify-between gap-3 px-3 py-3 rounded-lg border transition-colors",
                  log.repaired
                    ? "border-[#21262d] bg-[#0d1117] opacity-60"
                    : "border-[#21262d] bg-[#0d1117] hover:border-[#30363d]"
                )}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5",
                      sev.color
                    )}
                  >
                    {ZONE_LABELS[log.zone]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300 truncate">{log.description}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {formatDate(log.detectedAt)}
                      {log.repaired && log.repairedAt && (
                        <span className="text-brand-green-500 ml-2">
                          • Réparé le {formatDate(log.repairedAt)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", sev.color)}>
                    {sev.label}
                  </span>
                  {!readOnly && !log.repaired && (
                    <button
                      onClick={() => markRepaired(log.id)}
                      className="text-[11px] px-2 py-1 rounded bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20 hover:bg-brand-green-500/20 transition-colors"
                    >
                      Réparé
                    </button>
                  )}
                  {log.repaired && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20">
                      ✓ Réparé
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
