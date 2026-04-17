"use client";
import { useRouter } from "next/navigation";
import { ShieldBan, ShieldCheck, AlertTriangle, Calendar } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

export default function ListeNoirePage() {
  const router = useRouter();
  const { clients, toggleBlacklist } = useStore();
  const blacklisted = clients.filter((c) => c.isBlacklist);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShieldBan size={22} className="text-red-400" /> Liste Noire Globale</h1>
        <p className="text-slate-500 text-sm mt-0.5">{blacklisted.length} client(s) bloqué(s) — aucune location possible</p>
      </div>

      {blacklisted.length > 0 && (
        <div className="rounded-xl border border-brand-orange-500/20 bg-brand-orange-500/5 p-4 flex items-start gap-3">
          <AlertTriangle size={15} className="text-brand-orange-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400">Les clients ci-dessous ne peuvent pas être ajoutés à de nouvelles réservations ou locations. Le système les bloque automatiquement.</p>
        </div>
      )}

      <div className="space-y-3">
        {blacklisted.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-[#21262d] bg-[#161b22]">
            <ShieldCheck size={36} className="mx-auto mb-3 text-brand-green-500/30" />
            <p className="text-slate-500 font-semibold">Aucun client sur la liste noire</p>
            <p className="text-slate-600 text-sm mt-1">Tous les clients sont autorisés à louer.</p>
          </div>
        ) : blacklisted.map((c) => (
          <div key={c.id} className="rounded-xl border border-red-500/20 bg-[#161b22] p-5">
            <div className="flex items-start justify-between gap-4">
              <button onClick={() => router.push(`/clients/${c.id}`)} className="flex items-start gap-4 flex-1 text-left hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <ShieldBan size={16} className="text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold text-white">{c.firstName} {c.lastName}</p>
                    <span className="text-[11px] font-mono text-slate-500 bg-[#0d1117] px-2 py-0.5 rounded">{c.cin}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    <span className="text-slate-500 font-semibold">Motif: </span>{c.blacklistReason}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    {c.blacklistedAt && <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(c.blacklistedAt).toLocaleDateString("fr-FR")}</span>}
                    {c.phone && <span>{c.phone}</span>}
                    {c.city && <span>{c.city}</span>}
                  </div>
                </div>
              </button>
              <button onClick={() => toggleBlacklist(c.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-green-400 bg-brand-green-500/10 border border-brand-green-500/20 hover:bg-brand-green-500/20 transition-colors flex-shrink-0">
                <ShieldCheck size={12} /> Retirer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
