"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Tous les champs sont requis.");
      return;
    }
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 800));
    const ok = login(username, password);
    setLoading(false);
    if (ok) {
      router.push("/dashboard/statistiques");
    } else {
      setError("Identifiants incorrects. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-200">
      
      {/* SaaS-style Background Subtlety */}
      <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[-20%] w-[600px] h-[400px] bg-brand-green-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-[420px] z-10 flex flex-col items-center">
        
        {/* ✨ CUSTOM IMAGE LOGO BLOCK ✨ */}
        <div className="mb-10 flex flex-col items-center">
          <div className="w-16 h-16 mb-4 flex items-center justify-center relative">
            <img 
              src="/logo.png" 
              alt="RentCar-OSAuto Logo" 
              className="w-full h-full object-contain drop-shadow-2xl" 
            />
          </div>

          <h1 className="text-2xl font-semibold text-white tracking-tight">RentCar-OSAuto</h1>
          <p className="text-zinc-500 text-sm mt-1.5">Plateforme d'administration interne</p>
        </div>

        {/* Minimalist Card */}
        <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.08] p-8 rounded-3xl shadow-2xl">
          
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400 pl-1">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400 pl-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-4 pr-11 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-green-500/50 focus:bg-white/[0.05] transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPw(!showPw)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors rounded-md"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2 py-3 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed font-semibold rounded-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer / Demo Hint */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[11px] text-zinc-600 font-medium">
            RentCar-OS © {new Date().getFullYear()}
          </p>
        
        </div>
      </div>
    </div>
  );
}