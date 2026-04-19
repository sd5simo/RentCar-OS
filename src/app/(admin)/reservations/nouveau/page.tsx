"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle, CalendarDays } from "lucide-react";
import { useStore } from "@/store";

export default function NouvelleReservationPage() {
  const router = useRouter();
  const { clients, vehicles, addReservation } = useStore();
  const [form, setForm] = useState({ clientId: "", vehicleId: "", startDate: "", endDate: "", notes: "" });
  const [saved, setSaved] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const selectedClient = clients.find((c) => c.id === form.clientId);
  const days = form.startDate && form.endDate ? Math.max(0, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000)) : 0;
  const total = selectedVehicle ? selectedVehicle.dailyRate * days : 0;
  const isValid = form.clientId && form.vehicleId && form.startDate && form.endDate && days > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    if (selectedClient?.isBlacklist) { alert("Ce client est sur la liste noire!"); return; }

    addReservation({ clientId: form.clientId, vehicleId: form.vehicleId, startDate: form.startDate, endDate: form.endDate, totalAmount: total, status: "PENDING", notes: form.notes || null });
    setSaved(true);
    setTimeout(() => router.push("/reservations/liste"), 1200);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md shadow-sm"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Nouvelle Réservation</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">Bloquer un véhicule pour une date future</p>
        </div>
      </div>

      {saved && <div className="glass-panel rounded-2xl border-brand-green-500/30 bg-brand-green-500/10 p-4 text-sm font-bold text-brand-green-400 flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)]"><CheckCircle size={16} /> Réservation enregistrée avec succès! Redirection...</div>}
      {selectedClient?.isBlacklist && <div className="glass-panel rounded-2xl border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-400 flex items-center gap-2"><CheckCircle size={16} className="rotate-45" /> ⚠️ Attention : Ce client est actuellement sur la liste noire.</div>}

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-sm font-bold text-white flex items-center gap-2"><span className="p-1.5 bg-yellow-500/20 rounded-lg border border-yellow-500/30 flex items-center justify-center"><CalendarDays size={16} className="text-yellow-400" /></span> Détails de la réservation</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Client <span className="text-red-400">*</span></label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]">
              <option value="">Sélectionner un client...</option>
              {clients.filter(c => !c.isBlacklist).map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.cin}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Véhicule souhaité <span className="text-red-400">*</span></label>
            <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]">
              <option value="">Sélectionner un véhicule...</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year} · {v.plate} · {v.dailyRate} MAD/j {v.status !== "AVAILABLE" ? `(Actuellement: ${v.status})` : ""}</option>)}
            </select>
          </div>
          {/* ✅ Typage strict de l'itération des dates */}
          {(Object.entries({startDate: "Date de début", endDate: "Date de fin"}) as [keyof typeof form, string][]).map(([f, l]) => (
            <div key={f}>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{l} <span className="text-red-400">*</span></label>
              <input type="date" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]" />
            </div>
          ))}
        </div>

        <div className="pt-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Notes ou demandes spécifiques</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex: Livraison à l'aéroport, siège bébé requis..." rows={3}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all resize-none" />
        </div>

        {days > 0 && selectedVehicle && (
          <div className="glass-panel rounded-2xl p-5 border-brand-green-500/30 bg-brand-green-500/5 space-y-3 mt-6 shadow-inner">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Estimation financière</div>
            <div className="flex justify-between text-sm font-medium"><span className="text-slate-400">Durée calculée</span><span className="text-white">{days} jour{days > 1 ? "s" : ""}</span></div>
            <div className="flex justify-between text-sm font-medium"><span className="text-slate-400">Tarif journalier</span><span className="text-white">{selectedVehicle.dailyRate} MAD</span></div>
            <div className="flex justify-between text-base font-black border-t border-white/10 pt-3 mt-2"><span className="text-white">Total estimé</span><span className="text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{total.toLocaleString("fr-FR")} MAD</span></div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!isValid || selectedClient?.isBlacklist}
          className="w-full flex items-center justify-center gap-2 py-4 mt-6 rounded-xl bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 text-sm font-bold hover:bg-brand-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed">
          <Save size={16} /> Créer la réservation
        </button>
      </div>
    </div>
  );
}