"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Settings, Image as ImageIcon, CheckCircle, Save, Upload } from "lucide-react";
import { generateAndUploadPDF } from "@/lib/pdf-export"; // On va réutiliser Supabase via ce fichier

export default function ParametresPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Données
  const [settings, setSettings] = useState<any>(null);
  const [newPin, setNewPin] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Récupérer les paramètres au chargement
  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleUnlock = () => {
    if (pinInput === settings?.securityPin) {
      setIsUnlocked(true);
      setError("");
    } else {
      setError("Code PIN incorrect.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'stampUrl' | 'signatureUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convertir l'image en Base64 pour l'enregistrer dans la base de données
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, [field]: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: any = {
        logoUrl: settings.logoUrl,
        stampUrl: settings.stampUrl,
        signatureUrl: settings.signatureUrl,
      };

      if (newPin && newPin.length === 4) {
        payload.oldPin = settings.securityPin;
        payload.newPin = newPin;
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setSettings(data.settings);
        setNewPin("");
        alert("Paramètres sauvegardés avec succès !");
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Erreur réseau");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-slate-400">Chargement des paramètres...</div>;

  // --- ECRAN DE VERROUILLAGE ---
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green-500/10 mb-6">
          <Settings className="w-8 h-8 text-brand-green-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Paramètres de l'Agence</h1>
        <p className="text-sm text-slate-400 mb-8">Veuillez entrer le code PIN administrateur pour accéder à cette page.</p>
        
        <input 
          type="password" 
          maxLength={4}
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="w-full text-center text-4xl tracking-[1em] py-4 bg-[#0d1117] border border-[#30363d] text-white rounded-xl focus:outline-none focus:border-brand-green-500 transition-all mb-4"
        />
        
        {error && <p className="text-red-400 text-sm font-bold mb-4">{error}</p>}
        
        <button 
          onClick={handleUnlock}
          className="w-full py-4 bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-all"
        >
          <Lock size={18} /> Déverrouiller
        </button>
      </div>
    );
  }

  // --- ECRAN DES PARAMETRES ---
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="text-brand-green-400" /> Paramètres Globaux
          </h1>
          <p className="text-sm text-slate-400 mt-1">Configurez les éléments visuels de vos contrats.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold rounded-lg transition-all"
        >
          {isSaving ? "Sauvegarde..." : <><Save size={18} /> Enregistrer</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LOGO */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Logo de l'Agence</h2>
          <div className="flex flex-col items-center gap-4">
            <div className="w-full h-32 border-2 border-dashed border-[#30363d] rounded-lg flex items-center justify-center bg-[#0d1117] overflow-hidden">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="max-h-full object-contain" />
              ) : (
                <span className="text-slate-500 text-sm">Aucun logo</span>
              )}
            </div>
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#1c2130] hover:bg-[#21262d] text-slate-300 rounded border border-[#30363d] text-sm font-semibold transition-colors">
              <Upload size={14} /> Télécharger Image
              <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
            </label>
          </div>
        </div>

        {/* CACHET */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Cachet (Tampon)</h2>
          <div className="flex flex-col items-center gap-4">
            <div className="w-full h-32 border-2 border-dashed border-[#30363d] rounded-lg flex items-center justify-center bg-[#0d1117] overflow-hidden">
              {settings?.stampUrl ? (
                <img src={settings.stampUrl} alt="Cachet" className="max-h-full object-contain mix-blend-screen" />
              ) : (
                <span className="text-slate-500 text-sm">Aucun cachet</span>
              )}
            </div>
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#1c2130] hover:bg-[#21262d] text-slate-300 rounded border border-[#30363d] text-sm font-semibold transition-colors">
              <Upload size={14} /> Télécharger Image (PNG sans fond)
              <input type="file" accept="image/png" className="hidden" onChange={(e) => handleImageUpload(e, 'stampUrl')} />
            </label>
          </div>
        </div>

        {/* SIGNATURE ADMIN */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Signature Gérant</h2>
          <div className="flex flex-col items-center gap-4">
            <div className="w-full h-32 border-2 border-dashed border-[#30363d] rounded-lg flex items-center justify-center bg-[#0d1117] overflow-hidden">
              {settings?.signatureUrl ? (
                <img src={settings.signatureUrl} alt="Signature Admin" className="max-h-full object-contain mix-blend-screen" />
              ) : (
                <span className="text-slate-500 text-sm">Aucune signature</span>
              )}
            </div>
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#1c2130] hover:bg-[#21262d] text-slate-300 rounded border border-[#30363d] text-sm font-semibold transition-colors">
              <Upload size={14} /> Télécharger Image (PNG sans fond)
              <input type="file" accept="image/png" className="hidden" onChange={(e) => handleImageUpload(e, 'signatureUrl')} />
            </label>
          </div>
        </div>

        {/* SECURITE PIN */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Lock size={16} /> Changer le Code PIN</h2>
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Modifiez le code à 4 chiffres utilisé pour accéder à cette page.</p>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Nouveau PIN (4 chiffres)</label>
              <input 
                type="text" 
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 8520"
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500"
              />
            </div>
            <p className="text-[10px] text-brand-orange-400 border border-brand-orange-500/20 bg-brand-orange-500/10 p-2 rounded">
              Attention : Ne perdez pas ce code. Le code par défaut est 1234.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}