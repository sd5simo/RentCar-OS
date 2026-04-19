"use client";
import { useDataLoader } from "@/hooks/useDataLoader";
import { Car, RefreshCw, AlertTriangle } from "lucide-react";

export default function DataLoader({ children }: { children: React.ReactNode }) {
  const { loading, error, reload } = useDataLoader();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green-500 to-brand-green-700 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <Car size={24} className="text-white animate-pulse" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">RentCar-OS</p>
            <p className="text-slate-500 text-sm mt-1">Chargement des données...</p>
          </div>
          <div className="flex justify-center gap-1.5 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-green-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Erreur de connexion</p>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              Impossible de charger les données depuis la base de données.
            </p>
            <p className="text-red-400 text-xs mt-2 font-mono bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
              {error}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-slate-600 text-xs">Vérifiez que DATABASE_URL est configurée correctement.</p>
            <button onClick={reload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-semibold transition-colors mx-auto">
              <RefreshCw size={14} /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
