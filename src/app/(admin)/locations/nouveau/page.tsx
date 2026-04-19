"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Car, User, Calendar, Fuel, Gauge, Banknote, CheckCircle, FileText, Printer, Plus, X } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

export default function NouvelleLocationPage() {
  const router = useRouter();
  const { clients, vehicles, addRental, rentals } = useStore();
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [extras, setExtras] = useState<{ label: string; amount: string }[]>([]);
  const [newExtra, setNewExtra] = useState({ label: "", amount: "" });
  const [form, setForm] = useState({
    clientId: "", vehicleId: "", startDate: "", endDate: "",
    deposit: "2000", fuelLevelStart: "Plein", mileageStart: "",
    notes: "", paidAmount: "",
  });

  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const selectedClient = clients.find((c) => c.id === form.clientId);
  const days = form.startDate && form.endDate
    ? Math.max(0, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000))
    : 0;
  const baseAmount = selectedVehicle ? selectedVehicle.dailyRate * days : 0;
  const extrasTotal = extras.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalAmount = baseAmount + extrasTotal;
  const isValid = form.clientId && form.vehicleId && form.startDate && form.endDate && days > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    if (selectedClient?.isBlacklist) { alert("Ce client est sur la liste noire!"); return; } // ✅ 3. Correction Logique
    
    addRental({
      clientId: form.clientId, vehicleId: form.vehicleId,
      startDate: form.startDate, endDate: form.endDate, returnDate: null,
      dailyRate: selectedVehicle!.dailyRate, totalDays: days, totalAmount,
      paidAmount: parseFloat(form.paidAmount) || totalAmount,
      deposit: parseFloat(form.deposit) || 0, depositReturned: false,
      fuelLevelStart: form.fuelLevelStart, fuelLevelEnd: null,
      mileageStart: parseInt(form.mileageStart) || selectedVehicle!.mileage, mileageEnd: null,
      status: "ACTIVE", extras: extras.map(e => ({ label: e.label, amount: parseFloat(e.amount) })),
      notes: form.notes || null,
    });
    setSaved(true);
    setTimeout(() => router.push("/locations/liste"), 1500);
  };

  const nextContractNum = `CTR-${new Date().getFullYear()}-${String(rentals.length + 1).padStart(3, "0")}`;

  return (
    <div className={cn("animate-fade-in relative z-10 mx-auto", showPreview ? "max-w-7xl" : "max-w-4xl")}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md shadow-sm"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Nouvelle Location</h1>
            <p className="text-slate-400 text-sm mt-0.5 font-medium">Contrat N° <span className="text-brand-green-400 font-mono font-bold">{nextContractNum}</span></p>
          </div>
        </div>
        <button onClick={() => setShowPreview(!showPreview)} 
          className={cn("flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition-all backdrop-blur-md", 
          showPreview ? "bg-brand-orange-500/20 border-brand-orange-500/30 text-brand-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]" : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]")}>
          <FileText size={16} /> {showPreview ? "Masquer l'aperçu" : "Aperçu du contrat"}
        </button>
      </div>

      {saved && <div className="mb-6 glass-panel rounded-2xl border-brand-green-500/30 bg-brand-green-500/10 p-4 text-sm font-bold text-brand-green-400 flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)]"><CheckCircle size={16} /> Location créée avec succès! Redirection...</div>}
      {selectedClient?.isBlacklist && <div className="mb-6 glass-panel rounded-2xl border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-400 flex items-center gap-2"><CheckCircle size={16} className="rotate-45" /> ⚠️ Ce client est sur la liste noire. Location impossible.</div>}

      <div className={cn("grid gap-6", showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
        <div className="space-y-6">
          
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="text-sm font-bold text-white flex items-center gap-2"><span className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30 flex items-center justify-center"><User size={16} className="text-blue-400" /></span> Parties du contrat</div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Client <span className="text-red-400">*</span></label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]">
                <option value="">Sélectionner un client...</option>
                {clients.filter(c => !c.isBlacklist).map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.cin}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Véhicule disponible <span className="text-red-400">*</span></label>
              <select value={form.vehicleId} onChange={(e) => { const v = vehicles.find(x => x.id === e.target.value); setForm({ ...form, vehicleId: e.target.value, mileageStart: v?.mileage.toString() ?? "" }); }}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]">
                <option value="">Sélectionner un véhicule...</option>
                {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year} · {v.plate} · {v.dailyRate} MAD/j</option>)}
              </select>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="text-sm font-bold text-white flex items-center gap-2"><span className="p-1.5 bg-brand-green-500/20 rounded-lg border border-brand-green-500/30 flex items-center justify-center"><Calendar size={16} className="text-brand-green-400" /></span> Dates & Conditions</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ✅ 4. Typage strict de la boucle des inputs de date */}
              {(Object.entries({startDate: "Date de départ", endDate: "Date de retour prévue"}) as [keyof typeof form, string][]).map(([f, l]) => (
                <div key={f}>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{l} <span className="text-red-400">*</span></label>
                  <input type="date" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]" />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Kilométrage départ</label>
                <input type="number" value={form.mileageStart} onChange={(e) => setForm({ ...form, mileageStart: e.target.value })} placeholder="km"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all placeholder-slate-500" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Carburant départ</label>
                <select value={form.fuelLevelStart} onChange={(e) => setForm({ ...form, fuelLevelStart: e.target.value })}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]">
                  {["Vide", "1/4", "1/2", "3/4", "Plein"].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Caution Bloquée (MAD)</label>
              <input type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all" />
            </div>
          </div>

          {/* Extras */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-white">Extras & Suppléments</div>
              <button onClick={() => setNewExtra({ label: "", amount: "" })} className="text-[11px] font-bold uppercase tracking-widest text-brand-green-400 hover:text-white transition-colors bg-brand-green-500/10 px-2 py-1 rounded border border-brand-green-500/20">+ Ajouter</button>
            </div>
            {extras.map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="flex-1 text-sm font-medium text-white">{e.label}</span>
                <span className="text-sm font-bold text-brand-green-400">{parseFloat(e.amount).toLocaleString("fr-FR")} MAD</span>
                <button onClick={() => setExtras(extras.filter((_, j) => j !== i))} className="w-6 h-6 flex items-center justify-center rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"><X size={14} /></button>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <input value={newExtra.label} onChange={(e) => setNewExtra({ ...newExtra, label: e.target.value })} placeholder="GPS, siège bébé..."
                className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-green-500/50" />
              <input type="number" value={newExtra.amount} onChange={(e) => setNewExtra({ ...newExtra, amount: e.target.value })} placeholder="MAD"
                className="w-full sm:w-32 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50" />
              <button onClick={() => { if (newExtra.label && newExtra.amount) { setExtras([...extras, newExtra]); setNewExtra({ label: "", amount: "" }); } }}
                className="w-full sm:w-auto px-5 py-3 bg-brand-green-500/20 border border-brand-green-500/30 hover:bg-brand-green-500/30 text-brand-green-400 font-bold rounded-xl transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Financial summary */}
          {days > 0 && selectedVehicle && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border-brand-green-500/30 shadow-[0_8px_32px_rgba(34,197,94,0.1)] space-y-3">
              <div className="text-sm font-bold text-white mb-4">Récapitulatif financier</div>
              <div className="flex justify-between text-sm font-medium"><span className="text-slate-400">Location ({days}j × {selectedVehicle.dailyRate} MAD)</span><span className="text-white">{baseAmount.toLocaleString("fr-FR")} MAD</span></div>
              {extras.map((e, i) => <div key={i} className="flex justify-between text-sm font-medium"><span className="text-slate-400">+ {e.label}</span><span className="text-white">{parseFloat(e.amount).toLocaleString("fr-FR")} MAD</span></div>)}
              <div className="flex justify-between text-base font-black border-t border-white/10 pt-4 mt-2"><span className="text-white">Total</span><span className="text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{totalAmount.toLocaleString("fr-FR")} MAD</span></div>
              <div className="pt-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Montant encaissé à la signature</label>
                <input type="number" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} placeholder={`${totalAmount} MAD (total)`}
                  className="w-full px-4 py-3 bg-black/40 border border-brand-green-500/30 rounded-xl text-sm text-brand-green-400 font-bold focus:outline-none focus:border-brand-green-400 focus:bg-white/[0.05] transition-all" />
              </div>
            </div>
          )}

          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Notes / Observations état des lieux</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Rayures existantes, état du véhicule au départ..."
              rows={3} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all resize-none" />
          </div>

          <button onClick={handleSubmit} disabled={!isValid || selectedClient?.isBlacklist}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 text-sm font-bold hover:bg-brand-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed">
            <Save size={16} /> Créer le contrat
          </button>
        </div>

        {/* PDF Preview */}
        {showPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between glass-panel rounded-2xl px-6 py-4 border-brand-orange-500/30">
              <div className="text-sm font-bold text-brand-orange-400">Aperçu du document</div>
              <button onClick={() => window.print()} className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-brand-orange-500/20 border border-brand-orange-500/30 text-brand-orange-400 hover:bg-brand-orange-500/30 transition-all shadow-sm">
                <Printer size={14} /> Imprimer
              </button>
            </div>
            <div className="overflow-auto max-h-[85vh] rounded-3xl bg-white p-10 text-[12px] text-black shadow-2xl" style={{ fontFamily: "Arial, sans-serif" }}>
              <div className="flex justify-between border-b-2 border-gray-800 pb-4 mb-6">
                <div>
                  <div className="text-xl font-black tracking-tight">RentCar-OS</div>
                  <div className="text-xs text-gray-600 font-bold mt-1 uppercase tracking-wider">Location de Voitures</div>
                  <div className="text-xs text-gray-500 mt-2">123 Avenue Mohammed V, Casablanca</div>
                  <div className="text-xs text-gray-500">Tél: +212 522 123 456</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold border-2 border-gray-800 px-4 py-1.5 rounded uppercase tracking-wider">Contrat de Location</div>
                  <div className="text-xs text-gray-600 font-bold mt-3">N°: {nextContractNum}</div>
                  <div className="text-xs text-gray-600 font-bold mt-1">Date: {new Date().toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border border-gray-300 rounded-lg p-4"><div className="font-black text-xs border-b border-gray-200 pb-2 mb-3 uppercase tracking-widest text-gray-800">Loueur</div><div className="font-bold text-sm">RentCar-OS Location</div><div className="text-gray-600 mt-1">Casablanca, Maroc</div></div>
                <div className="border border-gray-300 rounded-lg p-4"><div className="font-black text-xs border-b border-gray-200 pb-2 mb-3 uppercase tracking-widest text-gray-800">Locataire</div>{selectedClient ? <><div className="font-bold text-sm uppercase">{selectedClient.lastName} {selectedClient.firstName}</div><div className="text-gray-600 mt-1">CIN/Passeport: {selectedClient.cin}</div><div className="text-gray-600 mt-1">Tél: {selectedClient.phone}</div></> : <div className="text-gray-400 italic">—</div>}</div>
              </div>
              <div className="border border-gray-300 rounded-lg p-4 mb-6"><div className="font-black text-xs border-b border-gray-200 pb-2 mb-3 uppercase tracking-widest text-gray-800">Détails du Véhicule</div>{selectedVehicle ? <div className="grid grid-cols-3 gap-3 text-sm"><span><b>Marque/Modèle:</b> {selectedVehicle.brand} {selectedVehicle.model}</span><span><b>Immatriculation:</b> {selectedVehicle.plate}</span><span><b>Carburant départ:</b> {form.fuelLevelStart}</span><span><b>Km départ:</b> {form.mileageStart || selectedVehicle.mileage}</span><span><b>Tarif de base:</b> {selectedVehicle.dailyRate} MAD/j</span></div> : <div className="text-gray-400 italic">—</div>}</div>
              <div className="border border-gray-300 rounded-lg p-4 mb-6"><div className="font-black text-xs border-b border-gray-200 pb-2 mb-3 uppercase tracking-widest text-gray-800">Conditions de Location</div><div className="grid grid-cols-3 gap-3 text-sm"><span><b>Date de départ:</b> {form.startDate || "—"}</span><span><b>Retour prévu:</b> {form.endDate || "—"}</span><span><b>Durée:</b> {days > 0 ? `${days} jours` : "—"}</span><span className="col-span-2"><b>Montant Total (TTC):</b> <b className="text-base">{totalAmount.toLocaleString("fr-FR")} MAD</b></span><span><b>Caution (Garantie):</b> {form.deposit} MAD</span></div></div>
              <div className="border-2 border-gray-800 rounded-lg p-4 mb-8"><div className="font-black text-xs uppercase mb-3 tracking-widest">État des Lieux au Départ</div><div className="grid grid-cols-2 gap-2 text-sm">{["Avant", "Arrière", "Côté Gauche", "Côté Droit", "Toit", "Intérieur"].map(z => <div key={z} className="flex items-center gap-2 py-1"><div className="w-3 h-3 border-2 border-gray-500 rounded-sm" /><span>{z} : ____________________</span></div>)}</div>{form.notes && <div className="mt-4 text-gray-700 text-sm"><b>Observations supplémentaires :</b> {form.notes}</div>}</div>
              <div className="grid grid-cols-2 gap-12 mt-10">
                <div className="text-center border-t border-gray-300 pt-4"><div className="font-bold text-xs mb-1 uppercase tracking-widest">Signature du Loueur</div><div className="text-gray-500 text-[10px] mb-12">RentCar-OS</div></div>
                <div className="text-center border-t border-gray-300 pt-4"><div className="font-bold text-xs mb-1 uppercase tracking-widest">Signature du Locataire</div><div className="text-[10px] text-gray-500 mb-12">(Lu et approuvé, bon pour accord)</div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}