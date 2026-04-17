"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle, Plus, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const TYPES: Record<string, { label: string; color: string }> = {
  DAMAGE:      { label: "Dommage véhicule",         color: "text-red-400 bg-red-500/10 border-red-500/20" },
  LATE_RETURN: { label: "Retour tardif",             color: "text-brand-orange-400 bg-brand-orange-500/10 border-brand-orange-500/20" },
  FUEL:        { label: "Carburant insuffisant",     color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  PAYMENT:     { label: "Défaut de paiement",        color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  OTHER:       { label: "Autre",                     color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
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
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><AlertTriangle size={20} className="text-brand-orange-400" /> Infractions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{infractions.length} enregistrées · {pending.length} en attente · {pendingAmount.toLocaleString("fr-FR")} MAD dû</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange-600 hover:bg-brand-orange-500 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus size={15} /> Signaler
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { f: "ALL",      l: "Total",       v: infractions.length,                              c: "text-white" },
          { f: "PENDING",  l: "En attente",  v: pending.length,                                  c: "text-brand-orange-400" },
          { f: "RESOLVED", l: "Résolues",    v: infractions.filter(i => i.resolved).length,      c: "text-brand-green-400" },
        ].map((s) => (
          <button key={s.f} onClick={() => setFilter(s.f as any)}
            className={cn("rounded-xl border bg-[#161b22] p-4 text-left transition-all", filter === s.f ? "border-brand-green-500/40" : "border-[#21262d] hover:border-[#30363d]")}>
            <p className="text-xs text-slate-500">{s.l}</p>
            <p className={cn("text-2xl font-bold mt-1", s.c)}>{s.v}</p>
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-brand-orange-500/25 bg-[#161b22] p-5 space-y-4">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-200">Nouvelle infraction</p><button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Client <span className="text-red-400">*</span></label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50">
                <option value="">Sélectionner...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.cin}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Contrat lié</label>
              <select value={form.rentalId} onChange={(e) => setForm({ ...form, rentalId: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50">
                <option value="">Aucun contrat</option>
                {rentals.map((r) => <option key={r.id} value={r.id}>{r.contractNum}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50">
                {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Montant dû (MAD)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0 (optionnel)"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Description <span className="text-red-400">*</span></label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décrivez l'infraction..." rows={2}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-orange-500/50 resize-none" />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={!form.clientId || !form.description}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange-600 hover:bg-brand-orange-500 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors text-sm">
            <Save size={14} /> Enregistrer l'infraction
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-600"><CheckCircle size={32} className="mx-auto mb-3 opacity-30" /><p>Aucune infraction</p></div>
        ) : filtered.map((i) => {
          const typeCfg = TYPES[i.type] ?? TYPES.OTHER;
          return (
            <div key={i.id} className={cn("rounded-xl border bg-[#161b22] p-5 transition-all",
              i.resolved ? "border-[#21262d] opacity-60" : "border-brand-orange-500/20 hover:border-brand-orange-500/30")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    i.resolved ? "bg-brand-green-500/10 border border-brand-green-500/20" : "bg-brand-orange-500/10 border border-brand-orange-500/20")}>
                    {i.resolved ? <CheckCircle size={18} className="text-brand-green-400" /> : <AlertTriangle size={18} className="text-brand-orange-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn("inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border", typeCfg.color)}>{typeCfg.label}</span>
                      {i.resolved && <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-green-500/15 text-brand-green-400 border border-brand-green-500/20"><CheckCircle size={9} /> Résolu</span>}
                      {i.amount && <span className="text-[11px] font-bold text-brand-orange-400">{i.amount.toLocaleString("fr-FR")} MAD</span>}
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{i.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {i.client && (
                        <button onClick={() => router.push(`/clients/${i.client!.id}`)} className="hover:text-brand-green-400 transition-colors">
                          {i.client.firstName} {i.client.lastName} ({i.client.cin})
                        </button>
                      )}
                      {i.rental && (
                        <button onClick={() => router.push(`/locations/${i.rental!.id}`)} className="font-mono hover:text-brand-green-400 transition-colors">
                          {i.rental.contractNum}
                        </button>
                      )}
                      <span>{new Date(i.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                </div>
                {!i.resolved && (
                  <button onClick={() => resolveInfraction(i.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-green-400 bg-brand-green-500/10 border border-brand-green-500/20 hover:bg-brand-green-500/20 transition-colors flex-shrink-0">
                    <CheckCircle size={12} /> Résoudre
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
