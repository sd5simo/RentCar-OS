"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/store";
import { TrendingUp, TrendingDown, Trophy, Car, Users, FileText, AlertTriangle, Clock, CheckCircle, Banknote, Calendar, Star } from "lucide-react";
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

  // 🔴 Tooltip adapté au style verre
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-xs shadow-2xl">
        <p className="text-slate-200 font-bold mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />
            <span className="text-slate-300">{p.name}:</span>
            <span className="text-white font-bold">{p.value.toLocaleString("fr-FR")} MAD</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Statistiques Financières</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">
            RentCar-OS · {vehicles.length} véhicules · données temps réel
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalAlerts.length > 0 && (
            <button onClick={() => document.getElementById("alerts-section")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel border-red-500/30 text-red-400 text-xs font-bold animate-pulse hover:animate-none hover:bg-red-500/10 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={14} /> {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? "s" : ""} critique{criticalAlerts.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenus",     value: `${totalRevenue.toLocaleString("fr-FR")} MAD`,  icon: <TrendingUp size={16} />,  glow: "green",  sub: `${rentals.length} contrats` },
          { label: "Total Dépenses",    value: `${totalExpenses.toLocaleString("fr-FR")} MAD`, icon: <TrendingDown size={16} />,glow: "orange", sub: `${expenses.length} entrées` },
          { label: "Bénéfice Net",      value: `${totalNet.toLocaleString("fr-FR")} MAD`,      icon: <Trophy size={16} />,      glow: totalNet >= 0 ? "green" : "orange", sub: totalRevenue > 0 ? `${((totalNet/totalRevenue)*100).toFixed(1)}% marge` : "—" },
          { label: "Impayés en attente",value: `${pendingPayments.toLocaleString("fr-FR")} MAD`,icon: <Banknote size={16} />,   glow: pendingPayments > 0 ? "orange" : "none", sub: `${activeRentals.length} locations actives` },
        ].map((k) => (
          // 🔴 .glass-panel remplace bg-[#161b22]
          <div key={k.label} className={cn("glass-panel rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300",
            k.glow === "green"  ? "border-brand-green-500/30 shadow-[0_8px_32px_rgba(34,197,94,0.15)] bg-brand-green-500/5" :
            k.glow === "orange" ? "border-brand-orange-500/30 shadow-[0_8px_32px_rgba(249,115,22,0.15)] bg-brand-orange-500/5" : "")}>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{k.label}</p>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md border",
                  k.glow === "green" ? "bg-brand-green-500/20 text-brand-green-400 border-brand-green-500/30" :
                  k.glow === "orange" ? "bg-brand-orange-500/20 text-brand-orange-400 border-brand-orange-500/30" : "bg-white/10 text-slate-300 border-white/20")}>
                  {k.icon}
                </div>
              </div>
              <p className="text-2xl font-black text-white leading-tight drop-shadow-sm">{k.value}</p>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">{k.sub}</p>
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
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
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
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
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
                      {unpaid > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange-500/20 text-brand-orange-400 border border-brand-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]">{unpaid.toLocaleString("fr-FR")} MAD dû</span>}
                    </div>
                    <p className="text-xs text-slate-300 truncate">{client?.firstName} {client?.lastName} · {vehicle?.plate} ({vehicle?.brand} {vehicle?.model})</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">{r.totalAmount.toLocaleString("fr-FR")} MAD</p>
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
        {/* Top 3 clients */}
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
                <p className="text-sm font-black text-brand-green-400">{c.spent.toLocaleString("fr-FR")} MAD</p>
              </button>
            ))}
            {topClients.filter(c => c.spent > 0).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Aucune donnée client</p>
            )}
          </div>
        </div>

        {/* Fleet status breakdown */}
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

      {/* Performance banner */}
      <div className={cn("glass-panel rounded-2xl p-5 flex items-center gap-5 backdrop-blur-2xl",
        totalNet >= 0 ? "border-brand-green-500/40 bg-brand-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.1)]" : "border-brand-orange-500/40 bg-brand-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.1)]")}>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border", 
          totalNet >= 0 ? "bg-brand-green-500/20 border-brand-green-500/30" : "bg-brand-orange-500/20 border-brand-orange-500/30")}>
          {totalNet >= 0 ? <Trophy size={24} className="text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> : <TrendingDown size={24} className="text-brand-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
        </div>
        <div className="flex-1">
          <p className={cn("text-base font-black drop-shadow-sm", totalNet >= 0 ? "text-brand-green-400" : "text-brand-orange-400")}>
            {totalNet >= 0 ? "🎉 Performance positive — RentCar-OS!" : "⚠️ Charges supérieures aux revenus"}
          </p>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            Bénéfice net: <span className="text-white font-bold">{totalNet.toLocaleString("fr-FR")} MAD</span>
            {totalRevenue > 0 && <> · Marge: <span className={cn("font-bold", totalNet >= 0 ? "text-brand-green-400" : "text-brand-orange-400")}>{((totalNet/totalRevenue)*100).toFixed(1)}%</span></>}
            {bestMonth.revenue > 0 && <> · Meilleur mois: <span className="text-white font-bold">{bestMonth.fullMonth}</span> ({bestMonth.revenue.toLocaleString("fr-FR")} MAD)</>}
          </p>
        </div>
      </div>
    </div>
  );
}