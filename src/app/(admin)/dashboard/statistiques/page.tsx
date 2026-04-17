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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-xs shadow-xl">
        <p className="text-slate-300 font-semibold mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-slate-400">{p.name}:</span>
            <span className="text-white font-bold">{p.value.toLocaleString("fr-FR")} MAD</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Statistiques Financières</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Rentify-OS · {vehicles.length} véhicules · données temps réel
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalAlerts.length > 0 && (
            <button onClick={() => document.getElementById("alerts-section")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold animate-pulse hover:animate-none transition-all">
              <AlertTriangle size={13} /> {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? "s" : ""} critique{criticalAlerts.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenus",     value: `${totalRevenue.toLocaleString("fr-FR")} MAD`,  icon: <TrendingUp size={15} />,  glow: "green",  sub: `${rentals.length} contrats` },
          { label: "Total Dépenses",    value: `${totalExpenses.toLocaleString("fr-FR")} MAD`, icon: <TrendingDown size={15} />,glow: "orange", sub: `${expenses.length} entrées` },
          { label: "Bénéfice Net",      value: `${totalNet.toLocaleString("fr-FR")} MAD`,      icon: <Trophy size={15} />,      glow: totalNet >= 0 ? "green" : "orange", sub: totalRevenue > 0 ? `${((totalNet/totalRevenue)*100).toFixed(1)}% marge` : "—" },
          { label: "Impayés en attente",value: `${pendingPayments.toLocaleString("fr-FR")} MAD`,icon: <Banknote size={15} />,   glow: pendingPayments > 0 ? "orange" : "none", sub: `${activeRentals.length} locations actives` },
        ].map((k) => (
          <div key={k.label} className={cn("rounded-xl border bg-[#161b22] p-5 relative overflow-hidden",
            k.glow === "green"  ? "border-brand-green-500/25 shadow-[0_0_25px_rgba(34,197,94,0.07)]" :
            k.glow === "orange" ? "border-brand-orange-500/25 shadow-[0_0_25px_rgba(249,115,22,0.07)]" : "border-[#21262d]")}>
            {k.glow === "green"  && <div className="absolute inset-0 bg-gradient-to-br from-brand-green-500/5 to-transparent pointer-events-none" />}
            {k.glow === "orange" && <div className="absolute inset-0 bg-gradient-to-br from-brand-orange-500/5 to-transparent pointer-events-none" />}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{k.label}</p>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center",
                  k.glow === "green" ? "bg-brand-green-500/15 text-brand-green-400" :
                  k.glow === "orange" ? "bg-brand-orange-500/15 text-brand-orange-400" : "bg-[#1c2130] text-slate-400")}>
                  {k.icon}
                </div>
              </div>
              <p className="text-xl font-bold text-white leading-tight">{k.value}</p>
              <p className="text-xs text-slate-500 mt-1">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => router.push("/clients/liste")} className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 text-left hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all">
          <div className="flex items-center gap-2 mb-2"><Users size={13} className="text-brand-green-400" /><p className="text-xs text-slate-500">Clients</p></div>
          <p className="text-2xl font-bold text-white">{clients.length}</p>
          <p className="text-xs text-slate-600 mt-0.5">{clients.filter(c => !c.isBlacklist).length} actifs · {clients.filter(c => c.isBlacklist).length} BL</p>
        </button>
        <button onClick={() => router.push("/vehicules/liste")} className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 text-left hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all">
          <div className="flex items-center gap-2 mb-2"><Car size={13} className="text-blue-400" /><p className="text-xs text-slate-500">Flotte</p></div>
          <p className="text-2xl font-bold text-white">{vehicles.length}</p>
          <p className="text-xs text-slate-600 mt-0.5">{vehicles.filter(v => v.status === "AVAILABLE").length} dispo · {occupancyPct}% occupé</p>
        </button>
        <button onClick={() => router.push("/locations/liste")} className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 text-left hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all">
          <div className="flex items-center gap-2 mb-2"><FileText size={13} className="text-purple-400" /><p className="text-xs text-slate-500">Locations</p></div>
          <p className="text-2xl font-bold text-white">{rentals.length}</p>
          <p className="text-xs text-slate-600 mt-0.5">{activeRentals.length} en cours · {completedRentals.length} terminées</p>
        </button>
        <button onClick={() => router.push("/moderation/infractions")} className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 text-left hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={13} className="text-brand-orange-400" /><p className="text-xs text-slate-500">Infractions</p></div>
          <p className="text-2xl font-bold text-white">{infractions.length}</p>
          <p className="text-xs text-slate-600 mt-0.5">{infractions.filter(i => !i.resolved).length} non résolues</p>
        </button>
      </div>

      {/* Charts */}
      {hasChartData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-slate-200">Revenus vs Dépenses</p>
                <p className="text-xs text-slate-500 mt-0.5">Par mois · {new Date().getFullYear()}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-brand-green-400"><span className="w-3 h-0.5 rounded bg-brand-green-400 inline-block" />Revenus</span>
                <span className="flex items-center gap-1.5 text-brand-orange-400"><span className="w-3 h-0.5 rounded bg-brand-orange-400 inline-block" />Dépenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.15} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#22c55e" strokeWidth={2} fill="url(#gRev)" />
                <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#f97316" strokeWidth={2} fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <p className="text-sm font-bold text-slate-200 mb-1">Bénéfice Net</p>
            <p className="text-xs text-slate-500 mb-4">Mensuel</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="net" name="Net" radius={[3, 3, 0, 0]}>
                  {monthlyData.map((m, i) => <Cell key={i} fill={m.net >= 0 ? "#22c55e" : "#f97316"} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Smart alerts + calendar row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="alerts-section">
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <AlertTriangle size={14} className="text-brand-orange-400" />
            Alertes automatiques
            {alerts.length > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-orange-500/15 text-brand-orange-400 border border-brand-orange-500/20">{alerts.length}</span>}
          </p>
          {alerts.length === 0 ? (
            <div className="rounded-xl border border-brand-green-500/20 bg-brand-green-500/5 p-4 flex items-center gap-3">
              <CheckCircle size={18} className="text-brand-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-brand-green-400">Tout est en ordre! 🎉</p>
                <p className="text-xs text-slate-500">Aucune alerte active sur la flotte.</p>
              </div>
            </div>
          ) : (
            <SmartAlertsPanel maxItems={6} />
          )}
        </div>

        <AvailabilityCalendar />
      </div>

      {/* Active rentals */}
      {activeRentals.length > 0 && (
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#21262d] flex items-center justify-between">
            <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock size={14} className="text-blue-400" />
              Locations en cours ({activeRentals.length})
            </p>
            <button onClick={() => router.push("/locations/liste")} className="text-xs text-brand-green-400 hover:underline">Voir tout →</button>
          </div>
          <div className="divide-y divide-[#21262d]">
            {activeRentals.map((r) => {
              const client = useStore.getState().clients.find((c) => c.id === r.clientId);
              const vehicle = useStore.getState().vehicles.find((v) => v.id === r.vehicleId);
              const daysLeft = Math.ceil((new Date(r.endDate).getTime() - Date.now()) / 86400000);
              const isLate = daysLeft < 0;
              const unpaid = r.totalAmount - r.paidAmount;
              return (
                <button key={r.id} onClick={() => router.push(`/locations/${r.id}`)}
                  className="w-full text-left px-5 py-3.5 hover:bg-[#1c2130] transition-colors group flex items-center gap-4">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border",
                    isLate ? "bg-red-500/10 border-red-500/20" : "bg-blue-500/10 border-blue-500/20")}>
                    {isLate ? <AlertTriangle size={15} className="text-red-400" /> : <Clock size={15} className="text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-200 font-mono">{r.contractNum}</span>
                      {isLate && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">En retard</span>}
                      {unpaid > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-orange-500/15 text-brand-orange-400 border border-brand-orange-500/20">{unpaid.toLocaleString("fr-FR")} MAD dû</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{client?.firstName} {client?.lastName} · {vehicle?.plate} ({vehicle?.brand} {vehicle?.model})</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">{r.totalAmount.toLocaleString("fr-FR")} MAD</p>
                    <p className={cn("text-xs font-semibold", isLate ? "text-red-400" : "text-slate-500")}>
                      {isLate ? `+${Math.abs(daysLeft)}j retard` : `−${daysLeft}j`}
                    </p>
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 group-hover:text-brand-green-400 flex-shrink-0 transition-colors"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top clients + fleet occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 3 clients */}
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Star size={14} className="text-yellow-400" /> Meilleurs clients
          </p>
          <div className="space-y-3">
            {topClients.filter(c => c.spent > 0).map((c, i) => (
              <button key={c.id} onClick={() => router.push(`/clients/${c.id}`)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-[#1c2130] transition-colors group">
                <span className={cn("text-lg font-black w-6 flex-shrink-0", i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-400" : "text-brand-orange-700")}>{i + 1}</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green-600 to-brand-green-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">{c.firstName[0]}{c.lastName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-slate-500">{c.count} location{c.count > 1 ? "s" : ""}</p>
                </div>
                <p className="text-sm font-bold text-brand-green-400">{c.spent.toLocaleString("fr-FR")} MAD</p>
              </button>
            ))}
            {topClients.filter(c => c.spent > 0).length === 0 && (
              <p className="text-sm text-slate-600 text-center py-4">Aucune donnée client</p>
            )}
          </div>
        </div>

        {/* Fleet status breakdown */}
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Car size={14} className="text-blue-400" /> État de la flotte
          </p>
          <div className="space-y-3">
            {[
              { label: "Disponibles", count: vehicles.filter(v => v.status === "AVAILABLE").length, color: "bg-brand-green-500", text: "text-brand-green-400" },
              { label: "En location", count: vehicles.filter(v => v.status === "RENTED").length, color: "bg-blue-500", text: "text-blue-400" },
              { label: "Maintenance", count: vehicles.filter(v => v.status === "MAINTENANCE").length, color: "bg-brand-orange-500", text: "text-brand-orange-400" },
              { label: "Hors service", count: vehicles.filter(v => v.status === "OUT_OF_SERVICE").length, color: "bg-red-500", text: "text-red-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className={cn("text-sm font-bold w-4 text-right flex-shrink-0", s.text)}>{s.count}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-400">{s.label}</span>
                    <span className="text-xs text-slate-600">{vehicles.length > 0 ? Math.round((s.count / vehicles.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", s.color)} style={{ width: `${vehicles.length > 0 ? (s.count / vehicles.length) * 100 : 0}%`, opacity: 0.8 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#21262d]">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Taux d'occupation</span>
              <span className="font-bold text-white">{occupancyPct}%</span>
            </div>
            <div className="h-2 bg-[#0d1117] rounded-full overflow-hidden mt-1">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all" style={{ width: `${occupancyPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Performance banner */}
      <div className={cn("rounded-xl border p-4 flex items-center gap-4",
        totalNet >= 0 ? "border-brand-green-500/20 bg-gradient-to-r from-brand-green-500/8 via-brand-green-500/4 to-transparent" : "border-brand-orange-500/20 bg-gradient-to-r from-brand-orange-500/8 to-transparent")}>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", totalNet >= 0 ? "bg-brand-green-500/20" : "bg-brand-orange-500/20")}>
          {totalNet >= 0 ? <Trophy size={20} className="text-brand-green-400" /> : <TrendingDown size={20} className="text-brand-orange-400" />}
        </div>
        <div className="flex-1">
          <p className={cn("text-sm font-bold", totalNet >= 0 ? "text-brand-green-400" : "text-brand-orange-400")}>
            {totalNet >= 0 ? "🎉 Performance positive — Rentify-OS!" : "⚠️ Charges supérieures aux revenus"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Bénéfice net: <span className="text-white font-semibold">{totalNet.toLocaleString("fr-FR")} MAD</span>
            {totalRevenue > 0 && <> · Marge: <span className={cn("font-semibold", totalNet >= 0 ? "text-brand-green-400" : "text-brand-orange-400")}>{((totalNet/totalRevenue)*100).toFixed(1)}%</span></>}
            {bestMonth.revenue > 0 && <> · Meilleur mois: <span className="text-white font-semibold">{bestMonth.fullMonth}</span> ({bestMonth.revenue.toLocaleString("fr-FR")} MAD)</>}
          </p>
        </div>
      </div>
    </div>
  );
}
