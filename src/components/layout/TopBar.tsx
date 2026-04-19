"use client";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useStore } from "@/store";

const TITLES: Record<string, string> = {
  "/dashboard/statistiques":    "Statistiques Financières",
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
  const { infractions, vehicles } = useStore();

  const unresolvedInfractions = infractions.filter((i) => !i.resolved).length;
  const criticalAlerts = vehicles.filter((v) => {
    const now = Date.now();
    const day = 86400000;
    if (v.nextOilChangeMileage - v.mileage <= 0) return true;
    if (v.technicalInspectionDate && Math.ceil((new Date(v.technicalInspectionDate).getTime() - now) / day) < 0) return true;
    if (v.insuranceExpiry && Math.ceil((new Date(v.insuranceExpiry).getTime() - now) / day) < 0) return true;
    return false;
  }).length;

  const totalAlerts = unresolvedInfractions + criticalAlerts;

  // Determine title from path (handles dynamic routes like /clients/[id])
  let title = TITLES[pathname] ?? "RentCar-OSAdmin";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const key = "/" + parts.slice(0, 2).join("/");
    title = TITLES[key] ?? title;
  }

  return (
    <header className="h-[60px] flex items-center justify-between px-6 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl flex-shrink-0">
      <div>
        <h1 className="text-sm font-bold text-slate-200">{title}</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">RentCar-OS — Espace Administration</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[11px] text-slate-400 hidden sm:block">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </div>
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <Bell size={15} />
          {totalAlerts > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              {totalAlerts > 9 ? "9+" : totalAlerts}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}