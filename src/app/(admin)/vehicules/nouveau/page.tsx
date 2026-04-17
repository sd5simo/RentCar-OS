"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle, Car } from "lucide-react";
import { useStore } from "@/store";

// ✅ 1. Moved the component OUTSIDE to prevent focus loss
const FieldInput = ({ label, value, onChange, type = "text", placeholder = "", options }: any) => (
  <div>
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">{label}</label>
    {options ? (
      <select value={value} onChange={onChange}
        className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50">
        {options.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-green-500/50" />
    )}
  </div>
);

export default function NouveauVehiculePage() {
  const router = useRouter();
  const addVehicle = useStore((s) => s.addVehicle);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    plate: "", brand: "", model: "", year: "2025", category: "ECONOMY",
    color: "", fuelType: "Essence", transmission: "Manuelle", seats: "5",
    dailyRate: "", mileage: "0", lastOilChangeMileage: "0", nextOilChangeMileage: "10000",
    technicalInspectionDate: "", insuranceExpiry: "", vignetteExpiry: "", notes: "",
    status: "AVAILABLE" as const,
  });

  const isValid = form.plate && form.brand && form.model && form.dailyRate;

  const handleSubmit = () => {
    if (!isValid) return;
    addVehicle({
      plate: form.plate, brand: form.brand, model: form.model, year: parseInt(form.year),
      category: form.category, color: form.color, fuelType: form.fuelType,
      transmission: form.transmission, seats: parseInt(form.seats),
      dailyRate: parseFloat(form.dailyRate), mileage: parseInt(form.mileage) || 0,
      lastOilChangeMileage: parseInt(form.lastOilChangeMileage) || 0,
      nextOilChangeMileage: parseInt(form.nextOilChangeMileage) || 10000,
      technicalInspectionDate: form.technicalInspectionDate || null,
      insuranceExpiry: form.insuranceExpiry || null,
      vignetteExpiry: form.vignetteExpiry || null,
      notes: form.notes || null, status: form.status,
    });
    setSaved(true);
    setTimeout(() => router.push("/vehicules/liste"), 1200);
  };

  // ✅ 2. Added a helper function to handle state updates cleanly
  const handleChange = (field: keyof typeof form) => (e: any) => {
    setForm({ ...form, [field]: e.target.value });
  };

  return (
    <div className="animate-fade-in max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#161b22] transition-colors"><ArrowLeft size={16} /></button>
        <div><h1 className="text-2xl font-bold text-white">Ajouter un Véhicule</h1><p className="text-slate-500 text-sm mt-0.5">Enregistrer un nouveau véhicule dans la flotte</p></div>
      </div>

      {saved && <div className="rounded-lg border border-brand-green-500/30 bg-brand-green-500/10 p-3 text-sm text-brand-green-400 flex items-center gap-2"><CheckCircle size={14} /> Véhicule ajouté! Redirection...</div>}

      <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-6 space-y-4">
        <p className="text-sm font-bold text-slate-300 border-b border-[#21262d] pb-3 flex items-center gap-2"><Car size={14} className="text-brand-green-400" /> Identification</p>
        <div className="grid grid-cols-2 gap-4">
          {/* ✅ 3. Replaced <F> with <FieldInput> and passed value/onChange */}
          <FieldInput label="Plaque d'immatriculation *" value={form.plate} onChange={handleChange("plate")} placeholder="26384-A-25" />
          <FieldInput label="Marque *" value={form.brand} onChange={handleChange("brand")} placeholder="Peugeot" />
          <FieldInput label="Modèle *" value={form.model} onChange={handleChange("model")} placeholder="208" />
          <FieldInput label="Année" value={form.year} onChange={handleChange("year")} type="number" />
          <FieldInput label="Catégorie" value={form.category} onChange={handleChange("category")} options={[{value:"ECONOMY",label:"Économique"},{value:"COMFORT",label:"Confort"},{value:"LUXURY",label:"Luxe"},{value:"SUV",label:"SUV"},{value:"VAN",label:"Van"}]} />
          <FieldInput label="Couleur" value={form.color} onChange={handleChange("color")} placeholder="Blanc" />
          <FieldInput label="Carburant" value={form.fuelType} onChange={handleChange("fuelType")} options={["Essence","Diesel","Hybride","Électrique"]} />
          <FieldInput label="Transmission" value={form.transmission} onChange={handleChange("transmission")} options={["Manuelle","Automatique"]} />
          <FieldInput label="Nombre de places" value={form.seats} onChange={handleChange("seats")} type="number" />
          <FieldInput label="Tarif journalier (MAD) *" value={form.dailyRate} onChange={handleChange("dailyRate")} type="number" placeholder="300" />
        </div>
      </div>

      <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-6 space-y-4">
        <p className="text-sm font-bold text-slate-300 border-b border-[#21262d] pb-3">Kilométrage & Entretien</p>
        <div className="grid grid-cols-3 gap-4">
          <FieldInput label="Kilométrage actuel" value={form.mileage} onChange={handleChange("mileage")} type="number" placeholder="0" />
          <FieldInput label="Dernière vidange (km)" value={form.lastOilChangeMileage} onChange={handleChange("lastOilChangeMileage")} type="number" />
          <FieldInput label="Prochaine vidange (km)" value={form.nextOilChangeMileage} onChange={handleChange("nextOilChangeMileage")} type="number" />
        </div>
      </div>

      <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-6 space-y-4">
        <p className="text-sm font-bold text-slate-300 border-b border-[#21262d] pb-3">Documents & Validités</p>
        <div className="grid grid-cols-3 gap-4">
          <FieldInput label="Visite technique" value={form.technicalInspectionDate} onChange={handleChange("technicalInspectionDate")} type="date" />
          <FieldInput label="Assurance" value={form.insuranceExpiry} onChange={handleChange("insuranceExpiry")} type="date" />
          <FieldInput label="Vignette" value={form.vignetteExpiry} onChange={handleChange("vignetteExpiry")} type="date" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observations sur l'état du véhicule..." rows={2}
            className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-green-500/50 resize-none" />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={!isValid}
        className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green-600 hover:bg-brand-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors">
        <Save size={15} /> Ajouter à la flotte
      </button>
    </div>
  );
}