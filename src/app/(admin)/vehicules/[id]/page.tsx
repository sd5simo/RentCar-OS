"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { ArrowLeft, Edit3, Save, X, AlertTriangle, CheckCircle, Car, Wrench, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: "Disponible", color: "text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20" },
  RENTED:    { label: "Loué",       color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  MAINTENANCE:   { label: "Maintenance",  color: "text-brand-orange-400 bg-brand-orange-500/10 border-brand-orange-500/20" },
  OUT_OF_SERVICE: { label: "Hors service", color: "text-red-400 bg-red-500/10 border-red-500/20" },
};
const ZONES = ["FRONT", "REAR", "LEFT", "RIGHT", "TOP", "INTERIOR"];
const ZONE_FR: Record<string, string> = { FRONT: "Avant", REAR: "Arrière", LEFT: "Gauche", RIGHT: "Droite", TOP: "Toit", INTERIOR: "Intérieur" };
const SEV_COL: Record<string, string> = {
  MINOR:    "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  MODERATE: "text-brand-orange-400 bg-brand-orange-500/10 border-brand-orange-500/20",
  SEVERE:   "text-red-400 bg-red-500/10 border-red-500/20",
};

function getAlerts(v: any) {
  const a: { sev: "CRITICAL" | "WARNING"; type: string; msg: string }[] = [];
  const now = Date.now(); const day = 86400000;
  const left = v.nextOilChangeMileage - v.mileage;
  if (left <= 0) a.push({ sev: "CRITICAL", type: "Vidange", msg: `Dépassée de ${Math.abs(left)} km` });
  else if (left <= 2000) a.push({ sev: "WARNING", type: "Vidange", msg: `Dans ${left} km` });
  if (v.technicalInspectionDate) { const d = Math.ceil((new Date(v.technicalInspectionDate).getTime() - now) / day); if (d < 0) a.push({ sev: "CRITICAL", type: "Visite technique", msg: `Expirée depuis ${Math.abs(d)}j` }); else if (d <= 30) a.push({ sev: "WARNING", type: "Visite technique", msg: `Dans ${d} jours` }); }
  if (v.insuranceExpiry) { const d = Math.ceil((new Date(v.insuranceExpiry).getTime() - now) / day); if (d < 0) a.push({ sev: "CRITICAL", type: "Assurance", msg: `Expirée depuis ${Math.abs(d)}j` }); else if (d <= 30) a.push({ sev: "WARNING", type: "Assurance", msg: `Dans ${d} jours` }); }
  if (v.vignetteExpiry) { const d = Math.ceil((new Date(v.vignetteExpiry).getTime() - now) / day); if (d < 0) a.push({ sev: "CRITICAL", type: "Vignette", msg: `Expirée depuis ${Math.abs(d)}j` }); else if (d <= 30) a.push({ sev: "WARNING", type: "Vignette", msg: `Dans ${d} jours` }); }
  return a;
}

function Chevron() { return (<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>); }

// ✅ 1. Moved the reusable field component OUTSIDE of the main page component
const VehicleField = ({ label, value, onChange, type = "text", editing }: any) => (
  <div>
    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold block mb-1">{label}</label>
    {editing
      ? <input type={type} value={value ?? ""} onChange={onChange} className="w-full px-3 py-2 bg-[#0d1117] border border-brand-green-500/40 rounded-lg text-sm text-slate-200 focus:outline-none" />
      : <p className="text-sm text-slate-200 py-1.5 px-1">{value || <span className="text-slate-600 italic text-xs">—</span>}</p>}
  </div>
);

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const vehicle = store.vehicles.find(v => v.id === id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(vehicle ?? {});
  const [tab, setTab] = useState<"info" | "maintenance" | "damages" | "history">("info");
  const [dmgForm, setDmgForm] = useState({ zone: "FRONT", description: "", severity: "MINOR" });
  const [showDmgForm, setShowDmgForm] = useState(false);
  const [repairModal, setRepairModal] = useState<string | null>(null);
  const [repairCostInput, setRepairCostInput] = useState("");

  if (!vehicle) return (
    <div className="text-center py-20 text-slate-500">
      <p>Véhicule introuvable</p>
      <button onClick={() => router.back()} className="mt-3 text-brand-green-400 hover:underline text-sm">← Retour</button>
    </div>
  );

  // Computed data
  const damages = store.getDamagesByVehicle(id);
  const rentals = store.getRentalsByVehicle(id);
  const totalRevenue = store.getVehicleTotalRevenue(id);
  const alerts = getAlerts(vehicle);
  const cfg = STATUS_CFG[vehicle.status];
  const activeRental = rentals.find(r => r.status === "ACTIVE");

  const save = () => { store.updateVehicle(id, form); setEditing(false); };

  const addDamage = () => {
    if (!dmgForm.description) return;
    store.addDamage(id, {
      description: dmgForm.description,
      severity: dmgForm.severity as "MINOR" | "MODERATE" | "SEVERE",
      zone: dmgForm.zone,
      repaired: false,
      repairedAt: null,
      cost: null,
      rentalId: activeRental?.id ?? null,
    });
    setDmgForm({ zone: "FRONT", description: "", severity: "MINOR" });
    setShowDmgForm(false);
  };

  const confirmRepair = () => {
    if (!repairModal) return;
    store.repairDamage(id, repairModal, parseFloat(repairCostInput) || 0);
    setRepairModal(null);
    setRepairCostInput("");
  };

  const F = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#161b22] transition-colors mt-1"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-white">{vehicle.brand} {vehicle.model} <span className="text-slate-500 font-normal text-lg">{vehicle.year}</span></h1>
            <span className="text-sm font-mono text-slate-400 bg-[#161b22] border border-[#21262d] px-2 py-0.5 rounded">{vehicle.plate}</span>
            {editing ? (
              <select value={form.status} onChange={F("status")} className="text-xs px-2 py-1 rounded-lg bg-[#1c2130] border border-brand-green-500/40 text-slate-200">
                {["AVAILABLE", "RENTED", "MAINTENANCE", "OUT_OF_SERVICE"].map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
              </select>
            ) : <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", cfg.color)}>{cfg.label}</span>}
            {alerts.some(a => a.sev === "CRITICAL") && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1">
                <AlertTriangle size={11} />{alerts.filter(a => a.sev === "CRITICAL").length} critique(s)
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">{vehicle.color} · {vehicle.fuelType} · {vehicle.transmission} · {vehicle.seats} places · {vehicle.dailyRate} MAD/j</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button onClick={save} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-green-600 hover:bg-brand-green-500 text-white text-xs font-semibold transition-colors"><Save size={13} />Sauvegarder</button>
              <button onClick={() => { setEditing(false); setForm(vehicle); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-slate-400 text-xs font-semibold hover:text-white transition-colors"><X size={13} />Annuler</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"><Edit3 size={13} />Modifier</button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-brand-green-500/20 bg-[#161b22] p-4"><p className="text-xs text-slate-500">Revenu total</p><p className="text-xl font-bold text-brand-green-400 mt-1">{totalRevenue.toLocaleString("fr-MA")} MAD</p></div>
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"><p className="text-xs text-slate-500">Kilométrage</p><p className="text-xl font-bold text-white mt-1">{vehicle.mileage.toLocaleString("fr-MA")} km</p></div>
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"><p className="text-xs text-slate-500">Locations</p><p className="text-xl font-bold text-white mt-1">{rentals.length}</p></div>
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"><p className="text-xs text-slate-500">Dommages actifs</p><p className={cn("text-xl font-bold mt-1", damages.filter(d => !d.repaired).length > 0 ? "text-brand-orange-400" : "text-white")}>{damages.filter(d => !d.repaired).length}</p></div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={cn("rounded-xl border p-4 flex items-center gap-3", a.sev === "CRITICAL" ? "border-red-500/30 bg-red-500/5" : "border-brand-orange-500/20 bg-brand-orange-500/5")}>
              <AlertTriangle size={16} className={a.sev === "CRITICAL" ? "text-red-400" : "text-brand-orange-400"} />
              <div>
                <p className={cn("text-sm font-bold", a.sev === "CRITICAL" ? "text-red-400" : "text-brand-orange-400")}>{a.type}</p>
                <p className="text-xs text-slate-400">{a.msg}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active rental banner */}
      {activeRental && (
        <button onClick={() => router.push(`/locations/${activeRental.id}`)} className="w-full text-left rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center gap-3 hover:bg-blue-500/10 transition-colors">
          <Clock size={16} className="text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-400">Actuellement en location</p>
            <p className="text-xs text-slate-400">Contrat {activeRental.contractNum} · retour prévu le {activeRental.endDate}</p>
          </div>
          <Chevron />
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#161b22] border border-[#21262d] rounded-xl p-1">
        {([["info", "Infos"], ["maintenance", "Entretien"], ["damages", `Dommages (${damages.length})`], ["history", `Historique (${rentals.length})`]] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all", tab === t ? "bg-brand-green-600 text-white" : "text-slate-500 hover:text-slate-300")}>{l}</button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === "info" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5 space-y-3">
            <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-3">Caractéristiques</p>
            <div className="grid grid-cols-2 gap-3">
              {/* ✅ 2. Passed value and onChange directly to the extracted VehicleField */}
              <VehicleField label="Marque" value={form.brand} onChange={F("brand")} editing={editing} />
              <VehicleField label="Modèle" value={form.model} onChange={F("model")} editing={editing} />
              <VehicleField label="Année" value={form.year} onChange={F("year")} type="number" editing={editing} />
              <VehicleField label="Catégorie" value={form.category} onChange={F("category")} editing={editing} />
              <VehicleField label="Couleur" value={form.color} onChange={F("color")} editing={editing} />
              <VehicleField label="Carburant" value={form.fuelType} onChange={F("fuelType")} editing={editing} />
              <VehicleField label="Transmission" value={form.transmission} onChange={F("transmission")} editing={editing} />
              <VehicleField label="Places" value={form.seats} onChange={F("seats")} type="number" editing={editing} />
              <VehicleField label="Tarif/jour MAD" value={form.dailyRate} onChange={F("dailyRate")} type="number" editing={editing} />
              <VehicleField label="Kilométrage" value={form.mileage} onChange={F("mileage")} type="number" editing={editing} />
            </div>
            <VehicleField label="Notes" value={form.notes} onChange={F("notes")} editing={editing} />
          </div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5 space-y-3">
            <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-3">Documents</p>
            <VehicleField label="Plaque" value={form.plate} onChange={F("plate")} editing={editing} />
            <VehicleField label="Visite technique" value={form.technicalInspectionDate} onChange={F("technicalInspectionDate")} type="date" editing={editing} />
            <VehicleField label="Expiration assurance" value={form.insuranceExpiry} onChange={F("insuranceExpiry")} type="date" editing={editing} />
            <VehicleField label="Expiration vignette" value={form.vignetteExpiry} onChange={F("vignetteExpiry")} type="date" editing={editing} />
          </div>
        </div>
      )}

      {/* Tab: Maintenance */}
      {tab === "maintenance" && (
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5 space-y-4">
          <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-3">Suivi vidange</p>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-xs text-slate-500 mb-1">Dernière vidange</p><p className="text-sm font-bold text-white">{vehicle.lastOilChangeMileage.toLocaleString("fr-MA")} km</p></div>
            <div><p className="text-xs text-slate-500 mb-1">Prochaine vidange</p><p className="text-sm font-bold text-white">{vehicle.nextOilChangeMileage.toLocaleString("fr-MA")} km</p></div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Km restants</p>
              <p className={cn("text-sm font-bold", (vehicle.nextOilChangeMileage - vehicle.mileage) <= 0 ? "text-red-400" : (vehicle.nextOilChangeMileage - vehicle.mileage) <= 2000 ? "text-brand-orange-400" : "text-brand-green-400")}>
                {Math.max(0, vehicle.nextOilChangeMileage - vehicle.mileage).toLocaleString("fr-MA")} km
              </p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progression</span>
              <span>{Math.min(100, Math.round(((vehicle.mileage - vehicle.lastOilChangeMileage) / (vehicle.nextOilChangeMileage - vehicle.lastOilChangeMileage)) * 100))}%</span>
            </div>
            <div className="h-3 bg-[#0d1117] rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", (vehicle.nextOilChangeMileage - vehicle.mileage) <= 0 ? "bg-red-500" : (vehicle.nextOilChangeMileage - vehicle.mileage) <= 2000 ? "bg-brand-orange-400" : "bg-brand-green-500")}
                style={{ width: `${Math.min(100, ((vehicle.mileage - vehicle.lastOilChangeMileage) / (vehicle.nextOilChangeMileage - vehicle.lastOilChangeMileage)) * 100)}%` }} />
            </div>
          </div>
          {editing && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#21262d]">
              <VehicleField label="Dernière vidange km" value={form.lastOilChangeMileage} onChange={F("lastOilChangeMileage")} type="number" editing={editing} />
              <VehicleField label="Prochaine vidange km" value={form.nextOilChangeMileage} onChange={F("nextOilChangeMileage")} type="number" editing={editing} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Damages */}
      {tab === "damages" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{damages.filter(d => !d.repaired).length} actif(s) · {damages.filter(d => d.repaired).length} réparé(s)</p>
            <button onClick={() => setShowDmgForm(!showDmgForm)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-orange-500/10 border border-brand-orange-500/20 text-brand-orange-400 hover:bg-brand-orange-500/20 transition-colors">
              <Plus size={12} />Signaler
            </button>
          </div>

          {showDmgForm && (
            <div className="rounded-xl border border-brand-orange-500/20 bg-[#161b22] p-4">
              <div className="grid grid-cols-3 gap-3">
                <select value={dmgForm.zone} onChange={e => setDmgForm({ ...dmgForm, zone: e.target.value })} className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none">
                  {ZONES.map(z => <option key={z} value={z}>{ZONE_FR[z]}</option>)}
                </select>
                <input value={dmgForm.description} onChange={e => setDmgForm({ ...dmgForm, description: e.target.value })} placeholder="Description..." className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none" />
                <div className="flex gap-2">
                  <select value={dmgForm.severity} onChange={e => setDmgForm({ ...dmgForm, severity: e.target.value })} className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none">
                    <option value="MINOR">Mineur</option>
                    <option value="MODERATE">Modéré</option>
                    <option value="SEVERE">Grave</option>
                  </select>
                  <button onClick={addDamage} className="px-3 py-2 bg-brand-orange-600 hover:bg-brand-orange-500 text-white rounded-lg transition-colors"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {damages.length === 0 && (
            <div className="text-center py-10 text-slate-600"><CheckCircle size={24} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Aucun dommage</p></div>
          )}

          {damages.map(d => {
            const linkedRental = d.rentalId ? store.rentals.find(r => r.id === d.rentalId) : null;
            const linkedClient = linkedRental ? store.getClientById(linkedRental.clientId) : null;
            return (
              <div key={d.id} className={cn("rounded-xl border p-4", d.repaired ? "border-[#21262d] bg-[#161b22] opacity-60" : "border-brand-orange-500/20 bg-[#161b22]")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", SEV_COL[d.severity])}>{ZONE_FR[d.zone]}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", SEV_COL[d.severity])}>
                        {d.severity === "SEVERE" ? "Grave" : d.severity === "MODERATE" ? "Modéré" : "Mineur"}
                      </span>
                      {d.repaired && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-green-500/15 text-brand-green-400 border border-brand-green-500/20">
                          ✓ Réparé{d.cost ? ` — ${d.cost.toLocaleString("fr-MA")} MAD` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-200">{d.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {d.reportedAt}{linkedClient && ` · Causé par ${linkedClient.firstName} ${linkedClient.lastName}`}
                    </p>
                  </div>
                  {!d.repaired && (
                    <button onClick={() => setRepairModal(d.id)} className="text-xs px-3 py-1.5 rounded-lg bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20 hover:bg-brand-green-500/20 transition-colors flex-shrink-0">
                      Marquer réparé
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: History */}
      {tab === "history" && (
        <div className="space-y-2">
          {rentals.length === 0 && <div className="text-center py-10 text-slate-600"><p className="text-sm">Aucune location</p></div>}
          {rentals.map(r => {
            const client = store.getClientById(r.clientId);
            return (
              <button key={r.id} onClick={() => router.push(`/locations/${r.id}`)} className="w-full text-left rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", r.status === "ACTIVE" ? "bg-blue-500/15 text-blue-400" : "bg-brand-green-500/15 text-brand-green-400")}>
                    {r.status === "ACTIVE" ? <Clock size={14} /> : <CheckCircle size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-200 font-mono">{r.contractNum}</p>
                    <p className="text-xs text-slate-500">{client?.firstName} {client?.lastName} · {r.startDate} → {r.endDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{r.totalAmount.toLocaleString("fr-MA")} MAD</p>
                    <p className="text-xs text-slate-500">{r.mileageEnd ? `${(r.mileageEnd - r.mileageStart).toLocaleString("fr-MA")} km` : "En cours"}</p>
                  </div>
                  <span className="text-slate-600 group-hover:text-brand-green-400 transition-colors"><Chevron /></span>
                </div>
              </button>
            );
          })}
          <div className="rounded-xl border border-brand-green-500/20 bg-[#161b22] p-4">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Revenu total généré</span><span className="font-bold text-brand-green-400">{totalRevenue.toLocaleString("fr-MA")} MAD</span></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-slate-400">Locations terminées</span><span className="font-bold text-white">{rentals.filter(r => r.status === "COMPLETED").length}</span></div>
          </div>
        </div>
      )}

      {/* Repair modal */}
      {repairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setRepairModal(null); setRepairCostInput(""); }} />
          <div className="relative bg-[#161b22] border border-[#30363d] rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Marquer comme réparé</h3>
            <label className="text-xs text-slate-400 uppercase tracking-wide mb-1.5 block">Coût (MAD)</label>
            <input type="number" value={repairCostInput} onChange={e => setRepairCostInput(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setRepairModal(null); setRepairCostInput(""); }} className="flex-1 py-2.5 bg-[#1c2130] border border-[#30363d] text-slate-400 font-semibold rounded-lg text-sm">Annuler</button>
              <button onClick={confirmRepair} className="flex-1 py-2.5 bg-brand-green-600 hover:bg-brand-green-500 text-white font-semibold rounded-lg text-sm transition-colors">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
