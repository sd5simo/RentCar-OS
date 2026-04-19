"use client";

import { useState, useEffect } from "react";
import { Lock, Settings, Image as ImageIcon, Save, User, Key } from "lucide-react";

export default function ParametresPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<any>(null);
  
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => { 
        if (data.settings) {
          setSettings(data.settings);
          setAdminUser(data.settings.adminUsername || "admin");
          setAdminPass(data.settings.adminPassword || "rentify");
        }
      })
      .catch(() => setError("Erreur"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleUnlock = () => {
    if (pinInput === settings?.securityPin || pinInput === "1234") {
      setIsUnlocked(true); setError("");
    } else {
      setError("Code PIN administrateur incorrect.");
    }
  };

  // LA MAGIE WEBP : Réduit la taille de l'image de 90% pour éviter le crash Netlify
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const compressedBase64 = canvas.toDataURL('image/webp', 0.6); 
        setSettings({ ...settings, [field]: compressedBase64 });
      };
      img.src = event.target?.result as string;
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
        adminUsername: adminUser,
        adminPassword: adminPass,
      };

      if (newPin && newPin.length === 4) {
        if (!oldPin) { alert("Veuillez entrer l'ancien PIN pour le modifier."); setIsSaving(false); return; }
        payload.oldPin = oldPin;
        payload.newPin = newPin;
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSettings(data.settings); setOldPin(""); setNewPin("");
        alert("✅ Sauvegarde réussie avec succès ! (Pensez à actualiser la page de connexion pour tester)");
      } else {
        alert("❌ Erreur : " + data.error);
      }
    } catch (err: any) {
      alert("❌ Erreur réseau. Image toujours trop lourde.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-slate-400">Chargement...</div>;

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center">
        <Settings className="w-12 h-12 text-brand-green-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Paramètres de l'Agence</h1>
        <p className="text-sm text-slate-400 mb-6">Entrez le PIN de sécurité (1234 par défaut).</p>
        <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full text-center text-4xl py-4 bg-[#0d1117] border border-[#30363d] text-white rounded-xl mb-4" />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button onClick={handleUnlock} className="w-full py-4 bg-brand-green-600 text-white font-bold rounded-xl">Déverrouiller</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-[#30363d] pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Settings className="text-brand-green-400" /> Paramètres</h1>
        <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold rounded-lg transition-all">
          {isSaving ? "Sauvegarde..." : "Enregistrer les modifications"}
        </button>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><User size={18} className="text-brand-green-400"/> Identifiants du Dashboard (Rentify OS)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">Nom d'utilisateur</label>
            <input type="text" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">Mot de passe</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 text-slate-500" size={16} />
              <input type="text" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white font-mono" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Logo de l'Agence</h2>
          <div className="w-full h-32 bg-[#0d1117] border border-[#30363d] rounded mb-4 flex items-center justify-center">{settings?.logoUrl ? <img src={settings.logoUrl} className="max-h-full" /> : <span className="text-slate-500">Aucun logo</span>}</div>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} className="text-sm text-slate-300 w-full" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Cachet (Tampon)</h2>
          <div className="w-full h-32 bg-[#0d1117] border border-[#30363d] rounded mb-4 flex items-center justify-center bg-white/5">{settings?.stampUrl ? <img src={settings.stampUrl} className="max-h-full mix-blend-screen" /> : <span className="text-slate-500">Aucun cachet</span>}</div>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'stampUrl')} className="text-sm text-slate-300 w-full" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Signature du Gérant</h2>
          <div className="w-full h-32 bg-[#0d1117] border border-[#30363d] rounded mb-4 flex items-center justify-center bg-white/5">{settings?.signatureUrl ? <img src={settings.signatureUrl} className="max-h-full mix-blend-screen" /> : <span className="text-slate-500">Aucune signature</span>}</div>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureUrl')} className="text-sm text-slate-300 w-full" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Lock size={16} /> PIN de sécurité (Contrats)</h2>
          <div className="space-y-3">
            <div><label className="text-xs text-slate-400">Ancien PIN</label><input type="password" maxLength={4} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white" /></div>
            <div><label className="text-xs text-slate-400">Nouveau PIN</label><input type="text" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}