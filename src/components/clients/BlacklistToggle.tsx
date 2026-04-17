"use client";

import { useState } from "react";
import { ShieldBan, ShieldCheck, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlacklistToggleProps {
  clientId: string;
  clientName: string;
  isBlacklisted: boolean;
  onToggle: (clientId: string, reason?: string) => void;
}

export default function BlacklistToggle({
  clientId,
  clientName,
  isBlacklisted,
  onToggle,
}: BlacklistToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onToggle(clientId, isBlacklisted ? undefined : reason);
    setShowConfirm(false);
    setReason("");
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
          isBlacklisted
            ? "bg-brand-green-500/10 text-brand-green-400 border-brand-green-500/20 hover:bg-brand-green-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
        )}
      >
        {isBlacklisted ? (
          <>
            <ShieldCheck size={13} />
            Retirer de la liste noire
          </>
        ) : (
          <>
            <ShieldBan size={13} />
            Ajouter à la liste noire
          </>
        )}
      </button>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-[#161b22] border border-[#30363d] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isBlacklisted
                    ? "bg-brand-green-500/15"
                    : "bg-red-500/15"
                )}
              >
                {isBlacklisted ? (
                  <ShieldCheck size={20} className="text-brand-green-400" />
                ) : (
                  <AlertTriangle size={20} className="text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {isBlacklisted ? "Retirer de la liste noire" : "Ajouter à la liste noire"}
                </p>
                <p className="text-xs text-slate-500">{clientName}</p>
              </div>
            </div>

            {!isBlacklisted && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                  Motif (obligatoire)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Raison du blacklistage..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500/50 resize-none transition-all"
                />
              </div>
            )}

            {isBlacklisted && (
              <p className="text-sm text-slate-400 mb-4">
                Ce client pourra à nouveau être lié à des réservations et locations.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-[#1c2130] border border-[#30363d] text-slate-400 hover:text-slate-200 font-semibold rounded-lg transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isBlacklisted && !reason.trim()}
                className={cn(
                  "flex-1 py-2.5 font-semibold rounded-lg transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed",
                  isBlacklisted
                    ? "bg-brand-green-600 hover:bg-brand-green-500 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white"
                )}
              >
                {isBlacklisted ? "Confirmer le retrait" : "Blacklister"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
