"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

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
    addReservation({ clientId: form.clientId, vehicleId: form.vehicleId, startDate: form.startDate, endDate: form.endDate, totalAmount: total, status: "PENDING", notes: form.notes || null });
    setSaved(true);
    setTimeout(() => router.push("/reservations/liste"), 1200);
  };

  return (
    <div className="animate-fade-in max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#161b22] transition-colors"><ArrowLeft size={16} /></button>
        <div><h1 className="text-2xl font-bold text-white">Nouvelle Réservation</h1><p className="text-slate-500 text-sm mt-0.5">Créer une réservation anticipée</p></div>
      </div>

      {saved && <div className="rounded-lg border border-brand-green-500/30 bg-brand-green-500/10 p-3 text-sm text-brand-green-400 flex items-center gap-2"><CheckCircle size={14} /> Réservation enregistrée! Redirection...</div>}
      {selectedClient?.isBlacklist && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">⚠️ Ce client est sur la liste noire.</div>}

      <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Client <span className="text-red-400">*</span></label>
          <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50">
            <option value="">Sélectionner un client...</option>
            {clients.filter(c => !c.isBlacklist).map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.cin}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Véhicule <span className="text-red-400">*</span></label>
          <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50">
            <option value="">Sélectionner un véhicule...</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year} · {v.plate} · {v.dailyRate} MAD/j {v.status !== "AVAILABLE" ? `(${v.status})` : ""}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[["startDate", "Date de début"], ["endDate", "Date de fin"]].map(([f, l]) => (
            <div key={f}>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">{l} <span className="text-red-400">*</span></label>
              <input type="date" value={form[f as keyof typeof form]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50" />
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Demandes spéciales..." rows={2}
            className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-green-500/50 resize-none" />
        </div>

        {days > 0 && selectedVehicle && (
          <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Durée</span><span className="text-slate-200">{days} jour{days > 1 ? "s" : ""}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Tarif/jour</span><span className="text-slate-200">{selectedVehicle.dailyRate} MAD</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-[#21262d] pt-2"><span className="text-slate-300">Total estimé</span><span className="text-brand-green-400 text-base">{total.toLocaleString("fr-FR")} MAD</span></div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!isValid || selectedClient?.isBlacklist}
          className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green-600 hover:bg-brand-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors">
          <Save size={15} /> Créer la réservation
        </button>
      </div>
    </div>
  );
}
