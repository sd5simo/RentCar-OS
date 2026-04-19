"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { ArrowLeft, Save, CheckCircle, User } from "lucide-react";

interface InputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false }: InputProps) => (
  <div>
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
      {label} {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]" />
  </div>
);

export default function NouveauClientPage() {
  const router = useRouter();
  const { addClient } = useStore();
  const [form, setForm] = useState({ cin: "", firstName: "", lastName: "", phone: "", email: "", address: "", city: "", licenseNum: "", licenseExp: "", notes: "" });
  const [saved, setSaved] = useState(false);
  
  const F = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const valid = form.cin && form.firstName && form.lastName && form.phone;

  const submit = () => {
    if (!valid) return;
    addClient({ ...form, email: form.email || null, address: form.address || null, city: form.city || null, licenseNum: form.licenseNum || null, licenseExp: form.licenseExp || null, notes: form.notes || null, isBlacklist: false, blacklistReason: null, blacklistedAt: null });
    setSaved(true);
    setTimeout(() => router.push("/clients/liste"), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md shadow-sm"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Nouveau Client</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">Enregistrer un nouveau profil client</p>
        </div>
      </div>

      {saved && <div className="glass-panel rounded-2xl border-brand-green-500/30 bg-brand-green-500/10 p-4 text-sm font-bold text-brand-green-400 flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)]"><CheckCircle size={16} />Client créé avec succès ! Redirection en cours...</div>}

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-sm font-bold text-white flex items-center gap-2"><span className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30 flex items-center justify-center"><User size={16} className="text-blue-400" /></span> Identité Principale</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Prénom" value={form.firstName} onChange={F("firstName")} placeholder="Prénom" required />
          <Input label="Nom" value={form.lastName} onChange={F("lastName")} placeholder="Nom" required />
          <Input label="CIN / Passeport" value={form.cin} onChange={F("cin")} placeholder="AB123456" required />
          <Input label="Téléphone" value={form.phone} onChange={F("phone")} placeholder="0661234567" required />
          <Input label="Email" value={form.email} onChange={F("email")} type="email" placeholder="email@example.ma" />
          <Input label="Ville" value={form.city} onChange={F("city")} placeholder="Casablanca" />
        </div>
        <div className="pt-2">
           <Input label="Adresse Complète" value={form.address} onChange={F("address")} placeholder="12 Rue Hassan II, Casablanca" />
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-sm font-bold text-white">Permis de conduire</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Numéro de permis" value={form.licenseNum} onChange={F("licenseNum")} placeholder="MA-12345" />
          <Input label="Date d'expiration" value={form.licenseExp} onChange={F("licenseExp")} type="date" />
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Notes internes (Confidenciel)</label>
        <textarea value={form.notes} onChange={F("notes")} placeholder="Observations, préférences du client..." rows={3} 
          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all resize-none" />
      </div>

      <button onClick={submit} disabled={!valid} 
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 text-sm font-bold hover:bg-brand-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed">
        <Save size={16} /> Enregistrer le client
      </button>
    </div>
  );
}