"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle, Car } from "lucide-react";
import { useStore } from "@/store";

// ✅ 1. Typage strict pour éviter l'erreur TypeScript (remplace le "any")
interface FieldInputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  placeholder?: string;
  options?: string[] | { value: string; label: string }[];
}

const FieldInput = ({ label, value, onChange, type = "text", placeholder = "", options }: FieldInputProps) => (
  <div>
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{label}</label>
    {options ? (
      <select value={value} onChange={onChange}
        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]">
        {options.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]" />
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

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md shadow-sm"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Ajouter un Véhicule</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">Enregistrer un nouveau véhicule dans la flotte</p>
        </div>
      </div>

      {saved && <div className="glass-panel rounded-2xl border-brand-green-500/30 bg-brand-green-500/10 p-4 text-sm font-bold text-brand-green-400 flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)]"><CheckCircle size={16} /> Véhicule ajouté avec succès ! Redirection en cours...</div>}

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        {/* ✅ 2. Remplacement du <p> par un <div> pour englober correctement les éléments blocs */}
        <div className="text-sm font-bold text-white flex items-center gap-2"><span className="p-1.5 bg-brand-green-500/20 rounded-lg border border-brand-green-500/30 flex items-center justify-center"><Car size={16} className="text-brand-green-400" /></span> Identification</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FieldInput label="Plaque d'immatriculation *" value={form.plate} onChange={handleChange("plate")} placeholder="26384-A-25" />
          <FieldInput label="Tarif journalier (MAD) *" value={form.dailyRate} onChange={handleChange("dailyRate")} type="number" placeholder="300" />
          <FieldInput label="Marque *" value={form.brand} onChange={handleChange("brand")} placeholder="Peugeot" />
          <FieldInput label="Modèle *" value={form.model} onChange={handleChange("model")} placeholder="208" />
          <FieldInput label="Année" value={form.year} onChange={handleChange("year")} type="number" />
          <FieldInput label="Catégorie" value={form.category} onChange={handleChange("category")} options={[{value:"ECONOMY",label:"Économique"},{value:"COMFORT",label:"Confort"},{value:"LUXURY",label:"Luxe"},{value:"SUV",label:"SUV"},{value:"VAN",label:"Van"}]} />
          <FieldInput label="Couleur" value={form.color} onChange={handleChange("color")} placeholder="Blanc" />
          <FieldInput label="Carburant" value={form.fuelType} onChange={handleChange("fuelType")} options={["Essence","Diesel","Hybride","Électrique"]} />
          <FieldInput label="Transmission" value={form.transmission} onChange={handleChange("transmission")} options={["Manuelle","Automatique"]} />
          <FieldInput label="Nombre de places" value={form.seats} onChange={handleChange("seats")} type="number" />
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-sm font-bold text-white">Kilométrage & Entretien</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FieldInput label="Kilométrage actuel" value={form.mileage} onChange={handleChange("mileage")} type="number" placeholder="0" />
          <FieldInput label="Dernière vidange (km)" value={form.lastOilChangeMileage} onChange={handleChange("lastOilChangeMileage")} type="number" />
          <FieldInput label="Prochaine vidange (km)" value={form.nextOilChangeMileage} onChange={handleChange("nextOilChangeMileage")} type="number" />
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-sm font-bold text-white">Documents & Validités</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FieldInput label="Visite technique" value={form.technicalInspectionDate} onChange={handleChange("technicalInspectionDate")} type="date" />
          <FieldInput label="Assurance" value={form.insuranceExpiry} onChange={handleChange("insuranceExpiry")} type="date" />
          <FieldInput label="Vignette" value={form.vignetteExpiry} onChange={handleChange("vignetteExpiry")} type="date" />
        </div>
        <div className="pt-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Notes & Observations</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observations sur l'état du véhicule..." rows={3}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all resize-none" />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={!isValid}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 text-sm font-bold hover:bg-brand-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed">
        <Save size={16} /> Ajouter à la flotte
      </button>
    </div>
  );
}