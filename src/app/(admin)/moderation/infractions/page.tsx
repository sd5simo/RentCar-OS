"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle, Plus, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const TYPES: Record<string, { label: string; color: string }> = {
  DAMAGE:      { label: "Dommage véhicule",         color: "text-red-400 bg-red-500/20 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]" },
  LATE_RETURN: { label: "Retour tardif",             color: "text-brand-orange-400 bg-brand-orange-500/20 border-brand-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.2)]" },
  FUEL:        { label: "Carburant insuffisant",     color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30 shadow-[0_0_8px_rgba(250,204,21,0.2)]" },
  PAYMENT:     { label: "Défaut de paiement",        color: "text-purple-400 bg-purple-500/20 border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)]" },
  OTHER:       { label: "Autre",                     color: "text-slate-300 bg-slate-500/20 border-slate-500/30 shadow-[0_0_8px_rgba(148,163,184,0.2)]" },
};

export default function InfractionsPage() {
  const router = useRouter();
  const { infractions, clients, rentals, addInfraction, resolveInfraction } = useStore();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientId: "", rentalId: "", type: "DAMAGE", description: "", amount: "", date: new Date().toISOString().slice(0, 10) });

  const enriched = infractions.map((i) => ({
    ...i,
    client: clients.find((c) => c.id === i.clientId),
    rental: rentals.find((r) => r.id === i.rentalId),
  }));

  const filtered = enriched.filter((i) =>
    filter === "ALL" || (filter === "PENDING" && !i.resolved) || (filter === "RESOLVED" && i.resolved)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const pending = infractions.filter((i) => !i.resolved);
  const pendingAmount = pending.reduce((s, i) => s + (i.amount ?? 0), 0);

  const handleSubmit = () => {
    if (!form.clientId || !form.description) return;
    addInfraction({ clientId: form.clientId, rentalId: form.rentalId || null, type: form.type, description: form.description, amount: form.amount ? parseFloat(form.amount) : null, date: form.date, resolved: false });
    setForm({ clientId: "", rentalId: "", type: "DAMAGE", description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight drop-shadow-md">
            <div className="p-2 bg-brand-orange-500/20 rounded-xl border border-brand-orange-500/30">
               <AlertTriangle size={20} className="text-brand-orange-400" />
            </div>
            Infractions
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            {infractions.length} enregistrées · <span className="text-brand-orange-400 font-bold">{pendingAmount.toLocaleString("fr-FR")} MAD</span> en attente
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange-500/20 hover:bg-brand-orange-500/30 border border-brand-orange-500/30 text-brand-orange-400 text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:shadow-[0_0_20px_rgba(249,115,22,0.25)]">
          <Plus size={16} /> Signaler
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { f: "ALL",      l: "Total",       v: infractions.length,                              c: "text-white" },
          { f: "PENDING",  l: "En attente",  v: pending.length,                                  c: "text-brand-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" },
          { f: "RESOLVED", l: "Résolues",    v: infractions.filter(i => i.resolved).length,      c: "text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" },
        ].map((s) => (
          <button key={s.f} onClick={() => setFilter(s.f as any)}
            className={cn("glass-panel glass-panel-hover rounded-2xl p-5 text-left group", filter === s.f ? "border-brand-orange-500/30 bg-brand-orange-500/10 shadow-[0_8px_32px_rgba(249,115,22,0.15)]" : "")}>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{s.l}</p>
            <p className={cn("text-3xl font-black mt-2 transition-transform origin-left group-hover:scale-105", s.c)}>{s.v}</p>
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass-panel rounded-2xl border-brand-orange-500/30 p-6 space-y-5 shadow-[0_8px_32px_rgba(249,115,22,0.1)]">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-white">Nouvelle infraction</p>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Client <span className="text-red-400">*</span></label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-orange-500/50 color-scheme-dark">
                <option value="">Sélectionner...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.cin}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Contrat lié</label>
              <select value={form.rentalId} onChange={(e) => setForm({ ...form, rentalId: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-orange-500/50 color-scheme-dark">
                <option value="">Aucun contrat</option>
                {rentals.map((r) => <option key={r.id} value={r.id}>{r.contractNum}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-orange-500/50 color-scheme-dark">
                {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Montant dû (MAD)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0 (optionnel)"
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-orange-500/50 placeholder-slate-600" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Description <span className="text-red-400">*</span></label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décrivez l'infraction..." rows={3}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange-500/50 resize-none" />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={!form.clientId || !form.description}
            className="flex items-center justify-center w-full md:w-auto gap-2 px-6 py-3 bg-brand-orange-500/20 hover:bg-brand-orange-500/30 border border-brand-orange-500/30 text-brand-orange-400 disabled:opacity-40 font-bold rounded-xl transition-all shadow-sm">
            <Save size={16} /> Enregistrer l'infraction
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass-panel text-center py-12 text-slate-400 rounded-2xl font-medium"><CheckCircle size={32} className="mx-auto mb-3 opacity-30" /><p>Aucune infraction</p></div>
        ) : filtered.map((i) => {
          const typeCfg = TYPES[i.type] ?? TYPES.OTHER;
          return (
            <div key={i.id} className={cn("glass-panel rounded-2xl p-5 transition-all group",
              i.resolved ? "border-white/5 opacity-60 hover:opacity-100" : "border-brand-orange-500/30 hover:border-brand-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]")}>
              <div className="flex items-start justify-between gap-5">
                <div className="flex items-start gap-5">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-md border shadow-sm",
                    i.resolved ? "bg-brand-green-500/20 border-brand-green-500/30 text-brand-green-400" : "bg-brand-orange-500/20 border-brand-orange-500/30 text-brand-orange-400")}>
                    {i.resolved ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className={cn("inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg border shadow-sm", typeCfg.color)}>{typeCfg.label}</span>
                      {i.resolved && <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-green-500/20 text-brand-green-400 border border-brand-green-500/30 shadow-sm"><CheckCircle size={12} /> Résolu</span>}
                      {i.amount && <span className="text-sm font-black text-brand-orange-400 drop-shadow-sm">{i.amount.toLocaleString("fr-FR")} MAD</span>}
                    </div>
                    <p className="text-sm font-medium text-white mb-3">{i.description}</p>
                    <div className="flex items-center gap-5 text-xs text-slate-400 font-semibold flex-wrap">
                      {i.client && (
                        <button onClick={() => router.push(`/clients/${i.client!.id}`)} className="hover:text-brand-green-400 transition-colors flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          {i.client.firstName} {i.client.lastName} ({i.client.cin})
                        </button>
                      )}
                      {i.rental && (
                        <button onClick={() => router.push(`/locations/${i.rental!.id}`)} className="font-mono hover:text-brand-green-400 transition-colors flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Contrat: {i.rental.contractNum}
                        </button>
                      )}
                      <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" />{new Date(i.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                </div>
                {!i.resolved && (
                  <button onClick={() => resolveInfraction(i.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-brand-green-400 bg-brand-green-500/20 border border-brand-green-500/30 hover:bg-brand-green-500/30 transition-all flex-shrink-0 shadow-sm">
                    <CheckCircle size={14} /> Résoudre
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}