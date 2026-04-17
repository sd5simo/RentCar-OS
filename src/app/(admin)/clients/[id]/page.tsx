"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { ArrowLeft, Edit3, Save, X, ShieldBan, ShieldCheck, Car, AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("fr-MA");

// Formateur de date sécurisé pour éviter les crashs de rendu d'objets
const formatDate = (dateValue: any) => {
  if (!dateValue) return "—";
  try {
    return new Date(dateValue).toLocaleDateString("fr-FR");
  } catch {
    return "—";
  }
};

function Chevron() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ✅ 1. MOVED OUTSIDE: Converted renderField into a proper external component
const ClientField = ({ label, value, onChange, type = "text", editing }: any) => (
  <div>
    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold block mb-1">{label}</label>
    {editing ? (
      <input 
        type={type} 
        value={value ?? ""} 
        onChange={onChange}
        className="w-full px-3 py-2 bg-[#0d1117] border border-brand-green-500/40 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500" 
      />
    ) : (
      <p className="text-sm text-slate-200 py-2 px-1">
        {value || <span className="text-slate-600 italic">Non renseigné</span>}
      </p>
    )}
  </div>
);

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const client = store.clients.find((c) => c.id === id);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(client ?? {});
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "rentals" | "damages" | "infractions">("info");

  if (!client) return (
    <div className="text-center py-20 text-slate-500">
      <p className="text-lg">Client introuvable</p>
      <button onClick={() => router.push("/clients/liste")} className="mt-3 text-brand-green-400 hover:underline text-sm">← Retour</button>
    </div>
  );

  const rentals = store.getRentalsByClient ? store.getRentalsByClient(id) : [];
  const damages = store.getDamagesByClient ? store.getDamagesByClient(id) : [];
  const infractions = store.getInfractionsByClient ? store.getInfractionsByClient(id) : [];
  const totalSpent = store.getClientTotalSpent ? store.getClientTotalSpent(id) : 0;
  
  const activeRental = rentals.find((r: any) => r.status === "ACTIVE");
  const totalDamages = damages.length;
  const unresolvedInfractions = infractions.filter((i: any) => !i.resolved).length;

  const saveEdit = () => {
    store.updateClient(id, form as any);
    setEditing(false);
  };

  const toggleBlacklist = () => {
    store.toggleBlacklist(id, blacklistReason || undefined);
    setShowBlacklistModal(false);
    setBlacklistReason("");
  };

  // ✅ 2. HELPER function to handle onChange events safely
  const handleFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#161b22] transition-colors mt-1">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0",
            client.isBlacklist ? "bg-red-700/60 border-2 border-red-500/40" : "bg-gradient-to-br from-brand-green-600 to-brand-green-900 border-2 border-brand-green-500/30")}>
            {client.firstName[0]}{client.lastName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{client.firstName} {client.lastName}</h1>
              {client.isBlacklist && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20"><ShieldBan size={11} />Blacklisté</span>}
              {activeRental && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20"><Car size={11} />En location</span>}
              {unresolvedInfractions > 0 && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-brand-orange-500/15 text-brand-orange-400 border border-brand-orange-500/20"><AlertTriangle size={11} />{unresolvedInfractions} infraction(s)</span>}
            </div>
            <p className="text-slate-500 text-sm mt-0.5">Client depuis {formatDate(client.createdAt)} · {client.cin}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-green-600 hover:bg-brand-green-500 text-white text-xs font-semibold transition-colors"><Save size={13} />Sauvegarder</button>
              <button onClick={() => { setEditing(false); setForm(client); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-slate-400 text-xs font-semibold hover:text-white transition-colors"><X size={13} />Annuler</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"><Edit3 size={13} />Modifier</button>
              <button onClick={() => setShowBlacklistModal(true)} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                client.isBlacklist ? "bg-brand-green-500/10 text-brand-green-400 border-brand-green-500/20 hover:bg-brand-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20")}>
                {client.isBlacklist ? <><ShieldCheck size={13} />Retirer</> : <><ShieldBan size={13} />Blacklister</>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total dépensé", value: `${fmt(totalSpent)} MAD`, color: "text-brand-green-400" },
          { label: "Locations", value: rentals.length, color: "text-white" },
          { label: "Dommages causés", value: totalDamages, color: totalDamages > 0 ? "text-brand-orange-400" : "text-white" },
          { label: "Infractions", value: infractions.length, color: unresolvedInfractions > 0 ? "text-red-400" : "text-white" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={cn("text-xl font-bold mt-1", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#161b22] border border-[#21262d] rounded-xl p-1">
        {([["info", "Informations"], ["rentals", `Locations (${rentals.length})`], ["damages", `Dommages (${damages.length})`], ["infractions", `Infractions (${infractions.length})`]] as const).map(([t, l]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn("flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
              activeTab === t ? "bg-brand-green-600 text-white" : "text-slate-500 hover:text-slate-300")}>
            {l}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5 space-y-4">
            <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-3">Informations personnelles</p>
            <div className="grid grid-cols-2 gap-4">
              {/* ✅ 3. REPLACED renderField() with <ClientField /> */}
              <ClientField label="Prénom" value={(form as any).firstName} onChange={handleFieldChange("firstName")} editing={editing} />
              <ClientField label="Nom" value={(form as any).lastName} onChange={handleFieldChange("lastName")} editing={editing} />
              <ClientField label="CIN" value={(form as any).cin} onChange={handleFieldChange("cin")} editing={editing} />
              <ClientField label="Téléphone" value={(form as any).phone} onChange={handleFieldChange("phone")} editing={editing} />
              <ClientField label="Email" value={(form as any).email} onChange={handleFieldChange("email")} editing={editing} />
              <ClientField label="Ville" value={(form as any).city} onChange={handleFieldChange("city")} editing={editing} />
            </div>
            <ClientField label="Adresse complète" value={(form as any).address} onChange={handleFieldChange("address")} editing={editing} />
            <ClientField label="Notes" value={(form as any).notes} onChange={handleFieldChange("notes")} editing={editing} />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5 space-y-4">
              <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-3">Permis de conduire</p>
              <ClientField label="Numéro de permis" value={(form as any).licenseNum} onChange={handleFieldChange("licenseNum")} editing={editing} />
              <ClientField label="Date d'expiration" value={(form as any).licenseExp} onChange={handleFieldChange("licenseExp")} type="date" editing={editing} />
            </div>
            {client.isBlacklist && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
                <p className="text-sm font-bold text-red-400 flex items-center gap-2 mb-2"><ShieldBan size={14} />Raison du blacklistage</p>
                <p className="text-sm text-slate-400">{client.blacklistReason}</p>
                <p className="text-xs text-slate-600 mt-2">Depuis le {formatDate(client.blacklistedAt)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Rentals */}
      {activeTab === "rentals" && (
        <div className="space-y-2">
          {rentals.length === 0 && <div className="text-center py-12 text-slate-600">Aucune location</div>}
          {rentals.map((r: any) => {
            const v = store.vehicles?.find((veh) => veh.id === r.vehicleId);
            
            // Analyse sécurisée de la chaîne JSON "extras"
            let parsedExtras: any[] = [];
            if (r.extras) {
              try {
                parsedExtras = typeof r.extras === "string" ? JSON.parse(r.extras) : r.extras;
              } catch {
                parsedExtras = [{ label: r.extras }];
              }
            }

            return (
              <button key={r.id} onClick={() => router.push(`/locations/${r.id}`)}
                className="w-full text-left rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    r.status === "ACTIVE" ? "bg-blue-500/15 text-blue-400" : r.status === "COMPLETED" ? "bg-brand-green-500/15 text-brand-green-400" : "bg-red-500/15 text-red-400")}>
                    {r.status === "ACTIVE" ? <Clock size={15} /> : <CheckCircle size={15} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-200 font-mono">{r.contractNum}</p>
                    <p className="text-xs text-slate-500">{v?.brand} {v?.model} ({v?.plate || "Inconnu"}) · {formatDate(r.startDate)} → {formatDate(r.endDate)}</p>
                    {parsedExtras.length > 0 && (
                      <p className="text-xs text-brand-orange-400 mt-0.5">⚠ Charges supplémentaires: {parsedExtras.map(e => e.label || e).join(", ")}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{fmt(r.totalAmount)} MAD</p>
                    <p className={cn("text-xs font-semibold", r.paidAmount >= r.totalAmount ? "text-brand-green-400" : "text-brand-orange-400")}>
                      Payé: {fmt(r.paidAmount)} MAD
                    </p>
                  </div>
                  <span className="text-slate-600 group-hover:text-brand-green-400 transition-colors"><Chevron /></span>
                </div>
              </button>
            );
          })}
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total facturé</span>
              <span className="font-bold text-white">{fmt(rentals.reduce((s: number, r: any) => s + r.totalAmount, 0))} MAD</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-400">Total encaissé</span>
              <span className="font-bold text-brand-green-400">{fmt(totalSpent)} MAD</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-400">Reste dû</span>
              <span className={cn("font-bold", rentals.reduce((s: number, r: any) => s + r.totalAmount - (r.paidAmount || 0), 0) > 0 ? "text-red-400" : "text-brand-green-400")}>
                {fmt(rentals.reduce((s: number, r: any) => s + r.totalAmount - (r.paidAmount || 0), 0))} MAD
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Damages */}
      {activeTab === "damages" && (
        <div className="space-y-2">
          {damages.length === 0 && <div className="text-center py-12 text-slate-600"><CheckCircle size={28} className="mx-auto mb-2 opacity-30" /><p>Aucun dommage causé par ce client</p></div>}
          {damages.map((d: any) => {
            const vehicle = store.vehicles?.find((v) => v.id === d.vehicleId);
            return (
              <div key={d.id} className={cn("rounded-xl border p-4", d.repaired ? "border-[#21262d] bg-[#161b22] opacity-70" : "border-brand-orange-500/25 bg-brand-orange-500/5")}>
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    d.repaired ? "bg-brand-green-500/15 text-brand-green-400" : "bg-brand-orange-500/15 text-brand-orange-400")}>
                    <Wrench size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-200">{d.description}</p>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        d.severity === "SEVERE" ? "bg-red-500/15 text-red-400 border-red-500/20" :
                        d.severity === "MODERATE" ? "bg-brand-orange-500/15 text-brand-orange-400 border-brand-orange-500/20" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20")}>
                        {d.severity === "SEVERE" ? "Grave" : d.severity === "MODERATE" ? "Modéré" : "Mineur"}
                      </span>
                      {d.repaired && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-green-500/15 text-brand-green-400 border border-brand-green-500/20">✓ Réparé</span>}
                    </div>
                    <p className="text-xs text-slate-500">Véhicule: {vehicle?.brand} {vehicle?.model} ({vehicle?.plate || "Inconnu"}) · Zone: {d.zone} · {formatDate(d.reportedAt)}</p>
                    {d.cost != null && <p className="text-xs text-brand-orange-400 mt-0.5">Coût réparation: {fmt(d.cost)} MAD</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Infractions */}
      {activeTab === "infractions" && (
        <div className="space-y-2">
          {infractions.length === 0 && <div className="text-center py-12 text-slate-600"><CheckCircle size={28} className="mx-auto mb-2 opacity-30" /><p>Aucune infraction</p></div>}
          {infractions.map((inf: any) => (
            <div key={inf.id} className={cn("rounded-xl border p-4", inf.resolved ? "border-[#21262d] bg-[#161b22] opacity-70" : "border-red-500/25 bg-red-500/5")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">{inf.type}</span>
                    {inf.resolved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-green-500/15 text-brand-green-400 border border-brand-green-500/20">✓ Résolu</span>}
                  </div>
                  <p className="text-sm text-slate-300">{inf.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(inf.date)}{inf.amount != null && ` · ${fmt(inf.amount)} MAD`}</p>
                </div>
                {!inf.resolved && (
                  <button onClick={() => store.resolveInfraction(inf.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20 hover:bg-brand-green-500/20 transition-colors flex-shrink-0">
                    Résoudre
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blacklist modal */}
      {showBlacklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowBlacklistModal(false)} />
          <div className="relative bg-[#161b22] border border-[#30363d] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">{client.isBlacklist ? "Retirer du blacklist" : "Blacklister ce client"}</h3>
            <p className="text-sm text-slate-500 mb-4">{client.firstName} {client.lastName}</p>
            {!client.isBlacklist && (
              <textarea value={blacklistReason} onChange={(e) => setBlacklistReason(e.target.value)} placeholder="Motif obligatoire..." rows={3}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500/50 resize-none mb-4" />
            )}
            {client.isBlacklist && <p className="text-sm text-slate-400 mb-4">Ce client pourra à nouveau effectuer des locations.</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowBlacklistModal(false)} className="flex-1 py-2.5 bg-[#1c2130] border border-[#30363d] text-slate-400 font-semibold rounded-lg text-sm hover:text-white transition-colors">Annuler</button>
              <button onClick={toggleBlacklist} disabled={!client.isBlacklist && !blacklistReason.trim()}
                className={cn("flex-1 py-2.5 font-semibold rounded-lg text-sm text-white transition-colors disabled:opacity-40",
                  client.isBlacklist ? "bg-brand-green-600 hover:bg-brand-green-500" : "bg-red-600 hover:bg-red-500")}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}