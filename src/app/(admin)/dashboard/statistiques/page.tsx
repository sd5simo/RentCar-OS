"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store";
import { TrendingUp, TrendingDown, Trophy, Car, Users, FileText, AlertTriangle, Clock, CheckCircle, Banknote, Calendar, Star, Eye, EyeOff, Wifi } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";
import SmartAlertsPanel from "@/components/dashboard/SmartAlertsPanel";
import AvailabilityCalendar from "@/components/dashboard/AvailabilityCalendar";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";

const MONTHS_SHORT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MONTHS_FULL  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export default function StatistiquesPage() {
  const router = useRouter();
  const { rentals, clients, vehicles, expenses, infractions } = useStore();
  const alerts = useSmartAlerts();
  const criticalAlerts = alerts.filter((a) => a.type === "CRITICAL");

  // 🔴 Master Privacy Toggle (Masqué par défaut comme demandé)
  const [showBalances, setShowBalances] = useState(false);

  // ── Live financials ──────────────────────────────────────────────
  const totalRevenue  = rentals.reduce((s, r) => s + r.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalNet      = totalRevenue - totalExpenses;
  const pendingPayments = rentals.reduce((s, r) => s + Math.max(0, r.totalAmount - r.paidAmount), 0);
  const activeRentals   = rentals.filter((r) => r.status === "ACTIVE");
  const completedRentals = rentals.filter((r) => r.status === "COMPLETED");

  // ── Monthly chart data ───────────────────────────────────────────
  const monthlyData = MONTHS_SHORT.map((m, i) => {
    const mR = rentals.filter((r) => new Date(r.startDate).getMonth() === i);
    const mE = expenses.filter((e) => new Date(e.date).getMonth() === i);
    const rev = mR.reduce((s, r) => s + r.paidAmount, 0);
    const exp = mE.reduce((s, e) => s + e.amount, 0);
    return { month: m, fullMonth: MONTHS_FULL[i], revenue: rev, expenses: exp, net: rev - exp, count: mR.length };
  });
  const bestMonth = monthlyData.reduce((a, b) => a.revenue > b.revenue ? a : b);
  const hasChartData = monthlyData.some((m) => m.revenue > 0 || m.expenses > 0);

  // ── Top clients ──────────────────────────────────────────────────
  const topClients = clients
    .map((c) => ({ ...c, spent: rentals.filter((r) => r.clientId === c.id).reduce((s, r) => s + r.paidAmount, 0), count: rentals.filter((r) => r.clientId === c.id).length }))
    .sort((a, b) => b.spent - a.spent).slice(0, 3);

  // ── Fleet occupancy ──────────────────────────────────────────────
  const occupancyPct = vehicles.length > 0 ? Math.round((vehicles.filter(v => v.status === "RENTED").length / vehicles.length) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-xs shadow-2xl">
        <p className="text-slate-200 font-bold mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />
            <span className="text-slate-300">{p.name}:</span>
            <span className="text-white font-bold">{showBalances ? `${p.value.toLocaleString("fr-FR")} MAD` : "•••• MAD"}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Tableau de bord</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">
            Rentify-OS · {vehicles.length} véhicules · données temps réel
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 🔴 Bouton Privacy (Mode discret) */}
          <button 
            onClick={() => setShowBalances(!showBalances)} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl text-slate-300 hover:text-white hover:border-brand-green-500/50 text-sm font-bold transition-all shadow-lg group">
            {showBalances ? <Eye size={18} className="text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> : <EyeOff size={18} className="text-slate-400 group-hover:text-white transition-colors" />}
            <span>{showBalances ? "Masquer les montants" : "Afficher les montants"}</span>
          </button>
        </div>
      </div>

      {/* 💳 KPI Bank Cards - Exactement comme votre nouvelle image */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { 
            label: "Total Revenus", value: totalRevenue.toLocaleString("fr-FR", { minimumFractionDigits: 2 }), 
            subLabel: "CONTRATS", sub: rentals.length,
            glowColor: "bg-emerald-500"
          },
          { 
            label: "Total Dépenses", value: totalExpenses.toLocaleString("fr-FR", { minimumFractionDigits: 2 }), 
            subLabel: "ENTRÉES", sub: expenses.length,
            glowColor: "bg-rose-500"
          },
          { 
            label: "Bénéfice Net", value: totalNet.toLocaleString("fr-FR", { minimumFractionDigits: 2 }), 
            subLabel: "MARGE", sub: totalRevenue > 0 ? `${((totalNet/totalRevenue)*100).toFixed(1)}%` : "—",
            glowColor: totalNet >= 0 ? "bg-indigo-500" : "bg-rose-500"
          },
          { 
            label: "Impayés en attente", value: pendingPayments.toLocaleString("fr-FR", { minimumFractionDigits: 2 }), 
            subLabel: "LOC. ACTIVES", sub: activeRentals.length,
            glowColor: pendingPayments > 0 ? "bg-orange-500" : "bg-slate-500"
          },
        ].map((k) => (
          <div key={k.label} 
            className="relative rounded-[24px] p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1 group border border-white/5 shadow-2xl bg-[#0c0c0e] h-[200px] flex flex-col justify-between isolate cursor-default">
            
            {/* Effet de lueur (Glow) coloré */}
            <div className={cn("absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-[60px] pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-700", k.glowColor)} />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-pattern-with-subtle-cross-lines.png')] opacity-[0.02] pointer-events-none mix-blend-overlay" />

            {/* Haut de la carte : Label et NFC */}
            <div className="flex justify-between items-start relative z-10 w-full">
              <p className="text-sm font-medium text-slate-400 tracking-wide drop-shadow-sm">{k.label}</p>
              <Wifi size={20} className="rotate-90 text-slate-500 drop-shadow-sm" />
            </div>

            {/* Milieu : Badge MAD + Montant (Chiffré ou Masqué) */}
            <div className="relative z-10 flex items-center gap-3 mt-4">
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300 shadow-sm">
                MAD
              </span>
              <p className="text-3xl font-semibold text-white tracking-tight drop-shadow-sm">
                {showBalances ? k.value : "•••• ••••"}
              </p>
            </div>

            {/* Bas de la carte : Sous-titre & Logo Mastercard */}
            <div className="flex justify-between items-end relative z-10 mt-auto drop-shadow-md">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{k.subLabel}</span>
                <span className="text-sm font-bold text-white">{k.sub}</span>
              </div>
              
              {/* Logo style Mastercard */}
              <div className="flex -space-x-3 opacity-90">
                 <div className="w-8 h-8 rounded-full bg-[#eb001b] mix-blend-screen" />
                 <div className="w-8 h-8 rounded-full bg-[#f79e1b] mix-blend-screen" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button onClick={() => router.push("/clients/liste")} className="glass-panel glass-panel-hover rounded-2xl p-4 text-left group">
          <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-lg bg-brand-green-500/20 border border-brand-green-500/30"><Users size={14} className="text-brand-green-400" /></div><p className="text-xs font-semibold text-slate-300">Clients</p></div>
          <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{clients.length}</p>
          <p className="text-xs text-slate-400 mt-1">{clients.filter(c => !c.isBlacklist).length} actifs · {clients.filter(c => c.isBlacklist).length} BL</p>
        </button>
        <button onClick={() => router.push("/vehicules/liste")} className="glass-panel glass-panel-hover rounded-2xl p-4 text-left group">
          <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30"><Car size={14} className="text-blue-400" /></div><p className="text-xs font-semibold text-slate-300">Flotte</p></div>
          <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{vehicles.length}</p>
          <p className="text-xs text-slate-400 mt-1">{vehicles.filter(v => v.status === "AVAILABLE").length} dispo · {occupancyPct}% occupé</p>
        </button>
        <button onClick={() => router.push("/locations/liste")} className="glass-panel glass-panel-hover rounded-2xl p-4 text-left group">
          <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30"><FileText size={14} className="text-purple-400" /></div><p className="text-xs font-semibold text-slate-300">Locations</p></div>
          <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{rentals.length}</p>
          <p className="text-xs text-slate-400 mt-1">{activeRentals.length} en cours · {completedRentals.length} term.</p>
        </button>
        <button onClick={() => router.push("/moderation/infractions")} className="glass-panel glass-panel-hover rounded-2xl p-4 text-left group">
          <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-lg bg-brand-orange-500/20 border border-brand-orange-500/30"><AlertTriangle size={14} className="text-brand-orange-400" /></div><p className="text-xs font-semibold text-slate-300">Infractions</p></div>
          <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{infractions.length}</p>
          <p className="text-xs text-slate-400 mt-1">{infractions.filter(i => !i.resolved).length} non résolues</p>
        </button>
      </div>

      {/* Charts */}
      {hasChartData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-base font-bold text-white">Revenus vs Dépenses</p>
                <p className="text-xs text-slate-400 mt-1">Évolution mensuelle · {new Date().getFullYear()}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-2 text-brand-green-400"><span className="w-4 h-1 rounded-full bg-brand-green-400 shadow-[0_0_8px_#4ade80]" />Revenus</span>
                <span className="flex items-center gap-2 text-brand-orange-400"><span className="w-4 h-1 rounded-full bg-brand-orange-400 shadow-[0_0_8px_#fb923c]" />Dépenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.25} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => showBalances ? `${(v/1000).toFixed(0)}k` : `••`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#22c55e" strokeWidth={3} fill="url(#gRev)" style={{ filter: 'drop-shadow(0px 4px 6px rgba(34,197,94,0.3))' }} />
                <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#f97316" strokeWidth={3} fill="url(#gExp)" style={{ filter: 'drop-shadow(0px 4px 6px rgba(249,115,22,0.3))' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-base font-bold text-white mb-1">Bénéfice Net</p>
            <p className="text-xs text-slate-400 mb-6">Mensuel</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => showBalances ? `${(v/1000).toFixed(0)}k` : `••`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="net" name="Net" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((m, i) => <Cell key={i} fill={m.net >= 0 ? "#22c55e" : "#f97316"} opacity={0.9} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Smart alerts + calendar row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="alerts-section">
        <div className="space-y-4">
          <p className="text-sm font-bold text-white flex items-center gap-2 drop-shadow-sm">
            <AlertTriangle size={16} className="text-brand-orange-400" />
            Alertes automatiques
            {alerts.length > 0 && <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-orange-500/20 text-brand-orange-400 border border-brand-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]">{alerts.length}</span>}
          </p>
          {alerts.length === 0 ? (
            <div className="glass-panel rounded-2xl border-brand-green-500/30 bg-brand-green-500/5 p-5 flex items-center gap-4">
              <CheckCircle size={24} className="text-brand-green-400 flex-shrink-0" style={{ filter: 'drop-shadow(0px 0px 8px rgba(34,197,94,0.5))' }} />
              <div>
                <p className="text-sm font-bold text-brand-green-400">Tout est en ordre! 🎉</p>
                <p className="text-xs text-slate-300 mt-0.5">Aucune alerte active sur la flotte.</p>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl overflow-hidden">
               <SmartAlertsPanel maxItems={6} />
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden p-2">
            <AvailabilityCalendar />
        </div>
      </div>

      {/* Active rentals */}
      {activeRentals.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <p className="text-sm font-bold text-white flex items-center gap-2 drop-shadow-sm">
              <Clock size={16} className="text-blue-400" />
              Locations en cours ({activeRentals.length})
            </p>
            <button onClick={() => router.push("/locations/liste")} className="text-xs font-semibold text-brand-green-400 hover:text-brand-green-300 hover:underline">Voir tout →</button>
          </div>
          <div className="divide-y divide-white/5">
            {activeRentals.map((r) => {
              const client = useStore.getState().clients.find((c) => c.id === r.clientId);
              const vehicle = useStore.getState().vehicles.find((v) => v.id === r.vehicleId);
              const daysLeft = Math.ceil((new Date(r.endDate).getTime() - Date.now()) / 86400000);
              const isLate = daysLeft < 0;
              const unpaid = r.totalAmount - r.paidAmount;
              return (
                <button key={r.id} onClick={() => router.push(`/locations/${r.id}`)}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors group flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border backdrop-blur-md",
                    isLate ? "bg-red-500/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "bg-blue-500/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]")}>
                    {isLate ? <AlertTriangle size={16} className="text-red-400" /> : <Clock size={16} className="text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white font-mono">{r.contractNum}</span>
                      {isLate && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">En retard</span>}
                      {unpaid > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange-500/20 text-brand-orange-400 border border-brand-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]">{showBalances ? unpaid.toLocaleString("fr-FR") : "•••"} MAD dû</span>}
                    </div>
                    <p className="text-xs text-slate-300 truncate">{client?.firstName} {client?.lastName} · {vehicle?.plate} ({vehicle?.brand} {vehicle?.model})</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">{showBalances ? r.totalAmount.toLocaleString("fr-FR") : "••••"} MAD</p>
                    <p className={cn("text-xs font-semibold mt-0.5", isLate ? "text-red-400" : "text-slate-400")}>
                      {isLate ? `+${Math.abs(daysLeft)}j retard` : `−${daysLeft}j`}
                    </p>
                  </div>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-hover:text-brand-green-400 flex-shrink-0 transition-colors ml-2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top clients + fleet occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[50px] pointer-events-none" />
          <p className="text-base font-bold text-white mb-5 flex items-center gap-2 drop-shadow-sm">
            <Star size={16} className="text-yellow-400" /> Meilleurs clients
          </p>
          <div className="space-y-3 relative z-10">
            {topClients.filter(c => c.spent > 0).map((c, i) => (
              <button key={c.id} onClick={() => router.push(`/clients/${c.id}`)}
                className="w-full text-left flex items-center gap-4 p-3.5 rounded-2xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group backdrop-blur-sm">
                <span className={cn("text-xl font-black w-6 text-center flex-shrink-0", i === 0 ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : i === 1 ? "text-slate-300" : "text-brand-orange-600")}>{i + 1}</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green-500 to-brand-green-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg">{c.firstName[0]}{c.lastName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-slate-400 font-medium">{c.count} location{c.count > 1 ? "s" : ""}</p>
                </div>
                <p className="text-sm font-black text-brand-green-400">{showBalances ? c.spent.toLocaleString("fr-FR") : "••••"} MAD</p>
              </button>
            ))}
            {topClients.filter(c => c.spent > 0).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Aucune donnée client</p>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none" />
          <p className="text-base font-bold text-white mb-5 flex items-center gap-2 drop-shadow-sm">
            <Car size={16} className="text-blue-400" /> État de la flotte
          </p>
          <div className="space-y-4 relative z-10">
            {[
              { label: "Disponibles", count: vehicles.filter(v => v.status === "AVAILABLE").length, color: "bg-brand-green-500 shadow-[0_0_10px_#22c55e]", text: "text-brand-green-400" },
              { label: "En location", count: vehicles.filter(v => v.status === "RENTED").length, color: "bg-blue-500 shadow-[0_0_10px_#3b82f6]", text: "text-blue-400" },
              { label: "Maintenance", count: vehicles.filter(v => v.status === "MAINTENANCE").length, color: "bg-brand-orange-500 shadow-[0_0_10px_#f97316]", text: "text-brand-orange-400" },
              { label: "Hors service", count: vehicles.filter(v => v.status === "OUT_OF_SERVICE").length, color: "bg-red-500 shadow-[0_0_10px_#ef4444]", text: "text-red-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <span className={cn("text-sm font-black w-5 text-right flex-shrink-0", s.text)}>{s.count}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-300">{s.label}</span>
                    <span className="text-xs font-bold text-white">{vehicles.length > 0 ? Math.round((s.count / vehicles.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden inset-shadow-sm">
                    <div className={cn("h-full rounded-full transition-all duration-1000", s.color)} style={{ width: `${vehicles.length > 0 ? (s.count / vehicles.length) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-300 font-semibold">Taux d'occupation global</span>
              <span className="font-black text-white">{occupancyPct}%</span>
            </div>
            <div className="h-2.5 bg-black/40 rounded-full overflow-hidden inset-shadow-sm">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${occupancyPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}