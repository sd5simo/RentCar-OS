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
    if (!isValid || !selectedClient?.isBlacklist === false) return;
    if (selectedClient?.isBlacklist) { alert("Ce client est sur la liste noire!"); return; }
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
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#161b22] transition-colors"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Nouvelle Location</h1>
          <p className="text-slate-500 text-sm mt-0.5">Contrat N° <span className="text-brand-green-400 font-mono">{nextContractNum}</span></p>
        </div>
        <button onClick={() => setShowPreview(!showPreview)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors", showPreview ? "bg-brand-orange-500/10 border-brand-orange-500/20 text-brand-orange-400" : "bg-[#161b22] border-[#30363d] text-slate-400 hover:text-slate-200")}>
          <FileText size={14} />{showPreview ? "Masquer" : "Aperçu contrat"}
        </button>
      </div>

      {saved && <div className="mb-4 rounded-lg border border-brand-green-500/30 bg-brand-green-500/10 p-3 text-sm text-brand-green-400 flex items-center gap-2"><CheckCircle size={14} /> Location créée! Redirection...</div>}
      {selectedClient?.isBlacklist && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">⚠️ Ce client est sur la liste noire. Location impossible.</div>}

      <div className={cn("grid gap-6", showPreview ? "grid-cols-2" : "grid-cols-1 max-w-2xl")}>
        <div className="space-y-4">
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-6 space-y-4">
            <p className="text-sm font-bold text-slate-300 border-b border-[#21262d] pb-3">Parties du contrat</p>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Client <span className="text-red-400">*</span></label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50">
                <option value="">Sélectionner un client...</option>
                {clients.filter(c => !c.isBlacklist).map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.cin}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Véhicule disponible <span className="text-red-400">*</span></label>
              <select value={form.vehicleId} onChange={(e) => { const v = vehicles.find(x => x.id === e.target.value); setForm({ ...form, vehicleId: e.target.value, mileageStart: v?.mileage.toString() ?? "" }); }}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50">
                <option value="">Sélectionner un véhicule...</option>
                {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year} · {v.plate} · {v.dailyRate} MAD/j</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-6 space-y-4">
            <p className="text-sm font-bold text-slate-300 border-b border-[#21262d] pb-3">Dates & Conditions</p>
            <div className="grid grid-cols-2 gap-4">
              {[["startDate", "Date de départ"], ["endDate", "Date de retour prévue"]].map(([f, l]) => (
                <div key={f}>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">{l} <span className="text-red-400">*</span></label>
                  <input type="date" value={form[f as keyof typeof form]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50" />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Kilométrage départ</label>
                <input type="number" value={form.mileageStart} onChange={(e) => setForm({ ...form, mileageStart: e.target.value })} placeholder="km"
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Carburant départ</label>
                <select value={form.fuelLevelStart} onChange={(e) => setForm({ ...form, fuelLevelStart: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50">
                  {["Vide", "1/4", "1/2", "3/4", "Plein"].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Caution (MAD)</label>
              <input type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50" />
            </div>
          </div>

          {/* Extras */}
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <p className="text-sm font-bold text-slate-300">Extras & Suppléments</p>
              <button onClick={() => setNewExtra({ label: "", amount: "" })} className="text-xs text-brand-green-400 hover:underline">+ Ajouter</button>
            </div>
            {extras.map((e, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-slate-300">{e.label}</span>
                <span className="text-sm font-semibold text-slate-200">{parseFloat(e.amount).toLocaleString("fr-FR")} MAD</span>
                <button onClick={() => setExtras(extras.filter((_, j) => j !== i))} className="text-red-400/50 hover:text-red-400"><X size={13} /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={newExtra.label} onChange={(e) => setNewExtra({ ...newExtra, label: e.target.value })} placeholder="GPS, siège bébé..."
                className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none" />
              <input type="number" value={newExtra.amount} onChange={(e) => setNewExtra({ ...newExtra, amount: e.target.value })} placeholder="MAD"
                className="w-24 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none" />
              <button onClick={() => { if (newExtra.label && newExtra.amount) { setExtras([...extras, newExtra]); setNewExtra({ label: "", amount: "" }); } }}
                className="px-3 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white rounded-lg transition-colors text-sm">+</button>
            </div>
          </div>

          {/* Financial summary */}
          {days > 0 && selectedVehicle && (
            <div className="rounded-xl border border-brand-green-500/20 bg-[#161b22] p-5 space-y-2">
              <p className="text-sm font-bold text-slate-300 border-b border-[#21262d] pb-2">Récapitulatif financier</p>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Location ({days}j × {selectedVehicle.dailyRate} MAD)</span><span className="text-slate-200">{baseAmount.toLocaleString("fr-FR")} MAD</span></div>
              {extras.map((e, i) => <div key={i} className="flex justify-between text-sm"><span className="text-slate-500">+ {e.label}</span><span className="text-slate-200">{parseFloat(e.amount).toLocaleString("fr-FR")} MAD</span></div>)}
              <div className="flex justify-between text-sm font-bold border-t border-[#21262d] pt-2"><span className="text-slate-300">Total</span><span className="text-brand-green-400 text-base">{totalAmount.toLocaleString("fr-FR")} MAD</span></div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block mt-3">Montant encaissé à la signature</label>
                <input type="number" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} placeholder={`${totalAmount} MAD (total)`}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Notes / Observations état des lieux</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Rayures existantes, état du véhicule au départ..."
              rows={3} className="w-full px-3 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-green-500/50 resize-none" />
          </div>

          <button onClick={handleSubmit} disabled={!isValid || selectedClient?.isBlacklist}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green-600 hover:bg-brand-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors">
            <Save size={15} /> Créer le contrat
          </button>
        </div>

        {/* PDF Preview */}
        {showPreview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">Aperçu contrat</p>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-orange-500/10 border border-brand-orange-500/20 text-brand-orange-400 hover:bg-brand-orange-500/20">
                <Printer size={12} /> Imprimer
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh] rounded-xl bg-white p-8 text-[11px] text-black" style={{ fontFamily: "Arial, sans-serif" }}>
              <div className="flex justify-between border-b-2 border-gray-800 pb-4 mb-5">
                <div><p className="text-lg font-bold">Rentify-OS</p><p className="text-xs text-gray-600">Location de Voitures</p><p className="text-xs text-gray-500">123 Avenue Mohammed V, Casablanca</p><p className="text-xs text-gray-500">Tél: +212 522 123 456</p></div>
                <div className="text-right"><p className="text-base font-bold border-2 border-gray-800 px-3 py-1 rounded">CONTRAT DE LOCATION</p><p className="text-xs text-gray-600 mt-1">N°: {nextContractNum}</p><p className="text-xs text-gray-600">Date: {new Date().toLocaleDateString("fr-FR")}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-gray-200 rounded p-3"><p className="font-bold text-xs border-b pb-1 mb-2 uppercase">Loueur</p><p className="font-semibold">Rentify-OSLocation de Voitures</p><p className="text-gray-600">Casablanca, Maroc</p></div>
                <div className="border border-gray-200 rounded p-3"><p className="font-bold text-xs border-b pb-1 mb-2 uppercase">Locataire</p>{selectedClient ? <><p className="font-semibold">{selectedClient.firstName} {selectedClient.lastName}</p><p className="text-gray-600">CIN: {selectedClient.cin}</p><p className="text-gray-600">Tél: {selectedClient.phone}</p></> : <p className="text-gray-400 italic">—</p>}</div>
              </div>
              <div className="border border-gray-200 rounded p-3 mb-4"><p className="font-bold text-xs border-b pb-1 mb-2 uppercase">Véhicule</p>{selectedVehicle ? <div className="grid grid-cols-3 gap-1"><span><b>Véhicule:</b> {selectedVehicle.brand} {selectedVehicle.model}</span><span><b>Plaque:</b> {selectedVehicle.plate}</span><span><b>Carburant:</b> {form.fuelLevelStart}</span><span><b>Km départ:</b> {form.mileageStart || selectedVehicle.mileage}</span><span><b>Tarif:</b> {selectedVehicle.dailyRate} MAD/j</span></div> : <p className="text-gray-400 italic">—</p>}</div>
              <div className="border border-gray-200 rounded p-3 mb-4"><p className="font-bold text-xs border-b pb-1 mb-2 uppercase">Conditions</p><div className="grid grid-cols-3 gap-1"><span><b>Départ:</b> {form.startDate || "—"}</span><span><b>Retour prévu:</b> {form.endDate || "—"}</span><span><b>Durée:</b> {days > 0 ? `${days}j` : "—"}</span><span><b>Total:</b> <b>{totalAmount.toLocaleString("fr-FR")} MAD</b></span><span><b>Caution:</b> {form.deposit} MAD</span></div></div>
              <div className="border-2 border-gray-800 rounded p-3 mb-4"><p className="font-bold text-xs uppercase mb-2">État des Lieux au Départ</p><div className="grid grid-cols-2 gap-1">{["Avant", "Arrière", "Gauche", "Droite", "Toit", "Intérieur"].map(z => <div key={z} className="flex items-center gap-2 py-0.5"><div className="w-3 h-3 border border-gray-400" /><span>{z}: _______________</span></div>)}</div>{form.notes && <p className="mt-2 text-gray-700"><b>Observations:</b> {form.notes}</p>}</div>
              <div className="grid grid-cols-2 gap-8 mt-6">
                <div className="text-center"><p className="font-semibold text-xs mb-1">Signature du Loueur</p><div className="border-b-2 border-gray-400 mt-8 mb-1" /><p className="text-gray-500 text-[10px]">Rentify-OS</p></div>
                <div className="text-center"><p className="font-semibold text-xs mb-1">Signature du Locataire</p><p className="text-[10px] text-gray-500">(Lu et approuvé)</p><div className="border-b-2 border-gray-400 mt-6 mb-1" /><p className="text-gray-500 text-[10px]">{selectedClient?.firstName} {selectedClient?.lastName}</p></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
