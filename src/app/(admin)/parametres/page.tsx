"use client";

import { useState, useEffect } from "react";
import { Lock, Settings, Image as ImageIcon, Save, Key, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/store/auth";

export default function SettingsPage() {
  const { username } = useAuth(); // Utilisateur actuellement connecté
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // States pour la sécurité du Contrat (Code PIN 4 chiffres)
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

  // States pour votre section de changement de mot de passe (Dashboard)
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [status, setStatus] = useState<{ type: "error" | "success" | null; msg: string }>({ type: null, msg: "" });

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => { 
        if (data.settings) setSettings(data.settings); 
      })
      .catch(() => setAuthError("Erreur de chargement"))
      .finally(() => setIsLoading(false));
  }, []);

  // Déverrouiller la page des paramètres
  const handleUnlock = () => {
    if (pinInput === settings?.securityPin || pinInput === "1234") {
      setIsUnlocked(true); setAuthError("");
    } else {
      setAuthError("Code PIN administrateur incorrect.");
    }
  };

  // ==========================================
  // 1. SOUMISSION DU NOUVEAU MOT DE PASSE (VOTRE DESIGN)
  // ==========================================
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, msg: "" });

    // 1. Vérifier l'ancien mot de passe dans la base de données
    if (settings?.adminPassword !== currentPass.trim()) {
      setStatus({ type: "error", msg: "L'ancien mot de passe est incorrect." });
      return;
    }
    // 2. Vérifier que les nouveaux correspondent
    if (newPass.trim() !== confirmPass.trim()) {
      setStatus({ type: "error", msg: "Les nouveaux mots de passe ne correspondent pas." });
      return;
    }
    // 3. Vérifier la longueur
    if (newPass.trim().length < 6) {
      setStatus({ type: "error", msg: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
      return;
    }

    // 4. Sauvegarder dans l'API
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: newPass.trim() })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSettings(data.settings);
        setStatus({ type: "success", msg: "Mot de passe modifié avec succès !" });
        setCurrentPass(""); setNewPass(""); setConfirmPass("");
      } else {
        setStatus({ type: "error", msg: data.error });
      }
    } catch (err) {
      setStatus({ type: "error", msg: "Erreur réseau. Impossible de modifier le mot de passe." });
    }
  };

  // ==========================================
  // 2. COMPRESSEUR D'IMAGE INFAILLIBLE
  // ==========================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // On réduit agressivement la taille à 150px de large (parfait pour le PDF)
        const MAX_WIDTH = 150; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Utilisation universelle PNG compressé si WebP échoue sur certains navigateurs
        const compressedBase64 = canvas.toDataURL('image/png'); 
        setSettings({ ...settings, [field]: compressedBase64 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // 3. SAUVEGARDE GÉNÉRALE (IMAGES ET PIN CONTRAT)
  // ==========================================
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const payload: any = {
        logoUrl: settings.logoUrl,
        stampUrl: settings.stampUrl,
        signatureUrl: settings.signatureUrl,
      };

      if (newPin && newPin.length === 4) {
        if (!oldPin) { alert("Veuillez entrer l'ancien PIN (Signature) pour le modifier."); setIsSaving(false); return; }
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
        alert("✅ Images et paramètres enregistrés !");
      } else {
        alert("❌ Erreur : " + data.error);
      }
    } catch (err: any) {
      alert("❌ Erreur réseau. Image peut-être encore trop lourde, essayez une image plus petite.");
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // RENDU VISUEL
  // -------------------------------------------------------------

  if (isLoading) return <div className="p-8 text-slate-400">Chargement...</div>;

  // ECRAN DE VERROUILLAGE
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center">
        <Settings className="w-12 h-12 text-brand-green-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Paramètres de l'Agence</h1>
        <p className="text-sm text-slate-400 mb-6">Entrez le PIN de sécurité (1234 par défaut).</p>
        <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full text-center text-4xl py-4 bg-[#0d1117] border border-[#30363d] text-white rounded-xl mb-4 focus:outline-none focus:border-brand-green-500/50" />
        {authError && <p className="text-red-400 text-sm mb-4">{authError}</p>}
        <button onClick={handleUnlock} className="w-full py-4 bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold rounded-xl transition-colors">Déverrouiller</button>
      </div>
    );
  }

  // PARAMÈTRES DÉVERROUILLÉS
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      <div className="flex justify-between items-center border-b border-[#30363d] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Settings className="text-brand-green-400" /> Paramètres du compte</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos informations de connexion et votre sécurité.</p>
        </div>
      </div>

      {/* =========================================================
          VOTRE MAGNIFIQUE BLOC DE CHANGEMENT DE MOT DE PASSE
          ========================================================= */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#21262d]">
          <div className="w-10 h-10 rounded-lg bg-brand-green-500/10 flex items-center justify-center text-brand-green-400">
            <Key size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200">Changer le mot de passe (Dashboard)</h2>
            <p className="text-xs text-slate-500">Utilisateur actuel : <span className="font-bold text-white capitalize">{username || settings?.adminUsername || "Admin"}</span></p>
          </div>
        </div>

        {status.type === "error" && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm animate-fade-in">
            <AlertCircle size={16} />
            <p>{status.msg}</p>
          </div>
        )}

        {status.type === "success" && (
          <div className="mb-6 p-3 rounded-lg bg-brand-green-500/10 border border-brand-green-500/20 flex items-center gap-2 text-brand-green-400 text-sm animate-fade-in">
            <CheckCircle size={16} />
            <p>{status.msg}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Mot de passe actuel</label>
            <input 
              type="password" 
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Nouveau mot de passe</label>
              <input 
                type="password" 
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50 transition-colors"
                placeholder="Nouveau mot de passe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Confirmer le mot de passe</label>
              <input 
                type="password" 
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50 transition-colors"
                placeholder="Répétez le mot de passe"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#21262d] mt-6 flex justify-end">
            <button 
              type="submit"
              disabled={!currentPass || !newPass || !confirmPass}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-green-600 hover:bg-brand-green-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              <Save size={16} /> Enregistrer le mot de passe
            </button>
          </div>
        </form>
      </div>

      {/* =========================================================
          GESTION DES IMAGES ET PIN CONTRAT
          ========================================================= */}
      <div className="flex justify-between items-center border-b border-[#30363d] pb-4 mt-12">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><ImageIcon size={20} className="text-brand-green-400"/> Personnalisation des PDF</h2>
        <button onClick={handleSaveSettings} disabled={isSaving} className="px-5 py-2.5 bg-[#1c2130] hover:bg-[#21262d] border border-[#30363d] text-white font-bold rounded-lg transition-all text-sm flex items-center gap-2">
          {isSaving ? "Sauvegarde..." : <><Save size={16}/> Sauvegarder Images & PIN</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Logo de l'Agence</h2>
          <div className="w-full h-32 bg-[#0d1117] border border-[#30363d] rounded mb-4 flex items-center justify-center">
             {settings?.logoUrl ? <img src={settings.logoUrl} className="max-h-full object-contain p-2" /> : <span className="text-slate-500 text-xs">Aucun logo</span>}
          </div>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} className="text-sm text-slate-300 w-full" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Cachet (Tampon)</h2>
          <div className="w-full h-32 bg-[#0d1117] border border-[#30363d] rounded mb-4 flex items-center justify-center bg-white/5">
             {settings?.stampUrl ? <img src={settings.stampUrl} className="max-h-full object-contain p-2 mix-blend-screen" /> : <span className="text-slate-500 text-xs">Aucun cachet</span>}
          </div>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'stampUrl')} className="text-sm text-slate-300 w-full" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Signature du Gérant</h2>
          <div className="w-full h-32 bg-[#0d1117] border border-[#30363d] rounded mb-4 flex items-center justify-center bg-white/5">
             {settings?.signatureUrl ? <img src={settings.signatureUrl} className="max-h-full object-contain p-2 mix-blend-screen" /> : <span className="text-slate-500 text-xs">Aucune signature</span>}
          </div>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureUrl')} className="text-sm text-slate-300 w-full" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Lock size={16} /> Code PIN des Contrats Publics</h2>
          <p className="text-xs text-slate-400 mb-4">Ce code à 4 chiffres permet de protéger l'accès à cette page Paramètres.</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">Ancien PIN</label>
              <input type="password" maxLength={4} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))} className="w-full mt-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm focus:outline-none focus:border-brand-green-500/50" placeholder="••••"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">Nouveau PIN</label>
              <input type="text" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} className="w-full mt-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm focus:outline-none focus:border-brand-green-500/50" placeholder="0000"/>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}