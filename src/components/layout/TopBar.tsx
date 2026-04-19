"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, AlertTriangle, ShieldAlert, Wrench, CheckCircle } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "/dashboard/statistiques":    "Tableau de bord",
  "/clients/liste":             "Liste des Clients",
  "/clients/liste-noire":       "Liste Noire",
  "/clients/nouveau":           "Nouveau Client",
  "/reservations/liste":        "Réservations",
  "/reservations/nouveau":      "Nouvelle Réservation",
  "/locations/liste":           "Locations",
  "/locations/nouveau":         "Nouvelle Location",
  "/vehicules/liste":           "Flotte de Véhicules",
  "/vehicules/nouveau":         "Ajouter un Véhicule",
  "/comptabilite/revenus":      "Revenus",
  "/comptabilite/charges":      "Charges & Dépenses",
  "/moderation/infractions":    "Infractions",
};

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { infractions, vehicles } = useStore();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Génération dynamique de la liste des alertes
  const alertsList: any[] = [];

  vehicles.forEach((v) => {
    const now = Date.now();
    const day = 86400000;
    
    if (v.nextOilChangeMileage - v.mileage <= 0) {
      alertsList.push({ id: `oil-${v.id}`, type: "warning", icon: <Wrench size={14} />, title: "Vidange dépassée", desc: `${v.brand} ${v.model} (${v.plate})`, link: `/vehicules/${v.id}` });
    }
    if (v.technicalInspectionDate && Math.ceil((new Date(v.technicalInspectionDate).getTime() - now) / day) < 0) {
      alertsList.push({ id: `tech-${v.id}`, type: "critical", icon: <AlertTriangle size={14} />, title: "Visite technique expirée", desc: `${v.brand} ${v.model} (${v.plate})`, link: `/vehicules/${v.id}` });
    }
    if (v.insuranceExpiry && Math.ceil((new Date(v.insuranceExpiry).getTime() - now) / day) < 0) {
      alertsList.push({ id: `ins-${v.id}`, type: "critical", icon: <ShieldAlert size={14} />, title: "Assurance expirée", desc: `${v.brand} ${v.model} (${v.plate})`, link: `/vehicules/${v.id}` });
    }
  });

  infractions.filter(i => !i.resolved).forEach(i => {
    alertsList.push({ id: `inf-${i.id}`, type: "infraction", icon: <AlertTriangle size={14} />, title: "Infraction non résolue", desc: i.description, link: `/moderation/infractions` });
  });

  let title = TITLES[pathname] ?? "Rentify-OS";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const key = "/" + parts.slice(0, 2).join("/");
    title = TITLES[key] ?? title;
  }

  return (
    <header className="h-[80px] flex items-center justify-between px-8 border-b border-white/[0.02] bg-transparent flex-shrink-0 relative z-40">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide">Espace Administration</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-xs font-medium text-slate-500 hidden sm:block bg-white/[0.03] px-4 py-2 rounded-full border border-white/[0.05]">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </div>
        
        {/* Conteneur du menu déroulant */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn("relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 border", 
              isDropdownOpen ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.03] border-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <Bell size={18} />
            {alertsList.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.6)] border border-[#06090f]">
                {alertsList.length > 9 ? "9+" : alertsList.length}
              </span>
            )}
          </button>

          {/* Menu déroulant */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0f141f]/95 backdrop-blur-3xl rounded-[1.5rem] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col z-50 animate-fade-in origin-top-right">
              
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                <p className="text-sm font-bold text-white">Notifications</p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  {alertsList.length} alerte{alertsList.length > 1 ? "s" : ""}
                </span>
              </div>
              
              <div className="max-h-[320px] overflow-y-auto overflow-x-hidden flex flex-col">
                {alertsList.length === 0 ? (
                   <div className="p-8 text-center flex flex-col items-center">
                     <div className="w-12 h-12 rounded-full bg-brand-green-500/10 border border-brand-green-500/20 flex items-center justify-center mb-3">
                       <CheckCircle size={24} className="text-brand-green-400" />
                     </div>
                     <p className="text-sm font-bold text-white">Tout est à jour</p>
                     <p className="text-xs text-slate-400 mt-1">Vous n'avez aucune alerte en attente.</p>
                   </div>
                ) : (
                   alertsList.map((alert, index) => (
                     <button 
                       key={alert.id} 
                       onClick={() => { setIsDropdownOpen(false); router.push(alert.link); }} 
                       className={cn("flex items-start gap-4 p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group", 
                         index === 0 ? "bg-white/[0.02]" : ""
                       )}
                     >
                       <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border shadow-sm group-hover:scale-110 transition-transform", 
                          alert.type === "critical" ? "bg-red-500/20 text-red-400 border-red-500/30" : 
                          alert.type === "warning" ? "bg-brand-orange-500/20 text-brand-orange-400 border-brand-orange-500/30" : 
                          "bg-purple-500/20 text-purple-400 border-purple-500/30"
                       )}>
                         {alert.icon}
                       </div>
                       <div className="flex-1 min-w-0 pt-0.5">
                         <p className="text-sm font-bold text-white mb-0.5 truncate">{alert.title}</p>
                         <p className="text-xs font-medium text-slate-400 truncate">{alert.desc}</p>
                       </div>
                     </button>
                   ))
                )}
              </div>

              {alertsList.length > 0 && (
                <div className="p-3 border-t border-white/5 bg-black/20">
                   <button 
                     onClick={() => { setIsDropdownOpen(false); router.push("/dashboard/statistiques"); }} 
                     className="w-full text-center py-2.5 text-xs font-bold text-brand-green-400 hover:text-white hover:bg-brand-green-500/20 rounded-xl transition-all"
                   >
                     Voir toutes les alertes
                   </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}