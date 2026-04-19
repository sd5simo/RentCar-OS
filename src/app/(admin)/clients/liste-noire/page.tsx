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
    <div className="space-y-6 animate-fade-in relative z-10">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight drop-shadow-md">
           <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
               <ShieldBan size={22} className="text-red-400" />
           </div>
           Liste Noire Globale
        </h1>
        <p className="text-slate-400 text-sm mt-1.5 font-medium"><span className="text-red-400 font-bold">{blacklisted.length} client(s)</span> bloqué(s) — aucune location possible</p>
      </div>

      {blacklisted.length > 0 && (
        <div className="glass-panel rounded-2xl border-red-500/30 bg-red-500/5 p-5 flex items-start gap-4 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 flex-shrink-0">
             <AlertTriangle size={18} className="text-red-400" />
          </div>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Les clients ci-dessous ne peuvent pas être ajoutés à de nouvelles réservations ou locations. Le système les bloque automatiquement. Vous devez retirer un client de cette liste pour l'autoriser à nouveau.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {blacklisted.length === 0 ? (
          <div className="glass-panel text-center py-16 rounded-3xl">
            <div className="w-20 h-20 bg-brand-green-500/10 border border-brand-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
               <ShieldCheck size={40} className="text-brand-green-400" />
            </div>
            <p className="text-white font-bold text-lg">Aucun client sur la liste noire</p>
            <p className="text-slate-400 text-sm mt-1 font-medium">Tous les clients enregistrés sont autorisés à louer des véhicules.</p>
          </div>
        ) : blacklisted.map((c) => (
          <div key={c.id} className="glass-panel rounded-3xl border-red-500/30 bg-red-500/5 p-6 shadow-[0_8px_32px_rgba(239,68,68,0.05)] transition-all hover:border-red-500/50 hover:shadow-[0_8px_32px_rgba(239,68,68,0.1)]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
              <button onClick={() => router.push(`/clients/${c.id}`)} className="flex items-start gap-5 flex-1 text-left group">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.2)] group-hover:scale-105 transition-transform">
                  <ShieldBan size={20} className="text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <p className="text-base font-bold text-white group-hover:text-red-400 transition-colors">{c.firstName} {c.lastName}</p>
                    <span className="text-xs font-mono font-bold text-slate-300 bg-black/40 border border-white/10 px-2 py-0.5 rounded-md shadow-sm">{c.cin}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl bg-black/20 p-3 rounded-xl border border-red-500/10">
                    <span className="text-red-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Motif du blocage</span>
                    {c.blacklistReason || <span className="italic text-slate-500">Aucun motif fourni.</span>}
                  </p>
                  <div className="flex items-center gap-5 mt-4 text-xs text-slate-400 font-semibold flex-wrap">
                    {c.blacklistedAt && <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-500"/> Ajouté le {new Date(c.blacklistedAt).toLocaleDateString("fr-FR")}</span>}
                    {c.phone && <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-500"/> {c.phone}</span>}
                    {c.city && <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-500"/> {c.city}</span>}
                  </div>
                </div>
              </button>
              <button onClick={() => toggleBlacklist(c.id)}
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-brand-green-400 bg-brand-green-500/20 border border-brand-green-500/30 hover:bg-brand-green-500/30 transition-all shadow-sm flex-shrink-0 mt-4 sm:mt-0">
                <ShieldCheck size={16} /> Autoriser à nouveau
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}