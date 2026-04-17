"use client";
import { useState } from "react";
import { useAuth } from "@/store/auth";
import { Key, Save, AlertCircle, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const { username, credentials, updatePassword } = useAuth();
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [status, setStatus] = useState<{ type: "error" | "success" | null; msg: string }>({ type: null, msg: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, msg: "" });

    if (!username) return;

    // 1. Vérifier l'ancien mot de passe
    if (credentials[username] !== currentPass.trim()) {
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

    // 4. Sauvegarder
    updatePassword(username, newPass.trim());
    setStatus({ type: "success", msg: "Mot de passe modifié avec succès !" });
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Paramètres du compte</h1>
        <p className="text-slate-500 text-sm">Gérez vos informations de connexion et votre sécurité.</p>
      </div>

      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#21262d]">
          <div className="w-10 h-10 rounded-lg bg-brand-green-500/10 flex items-center justify-center text-brand-green-400">
            <Key size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200">Changer le mot de passe</h2>
            <p className="text-xs text-slate-500">Utilisateur actuel : <span className="font-bold text-white capitalize">{username}</span></p>
          </div>
        </div>

        {status.type === "error" && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            <p>{status.msg}</p>
          </div>
        )}

        {status.type === "success" && (
          <div className="mb-6 p-3 rounded-lg bg-brand-green-500/10 border border-brand-green-500/20 flex items-center gap-2 text-brand-green-400 text-sm">
            <CheckCircle size={16} />
            <p>{status.msg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Save size={16} />
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}