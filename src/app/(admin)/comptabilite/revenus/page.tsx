"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/store";
import { TrendingUp, Car, Calendar, ChevronRight, Trophy, Banknote, Clock, Users, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function RevenusPage() {
  const router = useRouter();
  const { rentals, clients, vehicles } = useStore();

  const completedRentals = rentals.filter((r) => r.status === "COMPLETED" || r.status === "ACTIVE");
  const totalRevenue = completedRentals.reduce((s, r) => s + r.paidAmount, 0);
  const totalPending = rentals.reduce((s, r) => s + Math.max(0, r.totalAmount - r.paidAmount), 0);
  const avgRental = completedRentals.length > 0 ? totalRevenue / completedRentals.length : 0;

  // Monthly breakdown
  const monthlyData = MONTHS.map((m, i) => {
    const mRentals = completedRentals.filter((r) => new Date(r.startDate).getMonth() === i);
    return { month: m, fullMonth: MONTHS_FR[i], revenue: mRentals.reduce((s, r) => s + r.paidAmount, 0), count: mRentals.length, rentals: mRentals };
  });

  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue));
  const bestMonth = monthlyData.reduce((a, b) => a.revenue > b.revenue ? a : b);

  // Top clients
  const clientRevenue = clients.map((c) => {
    const r = rentals.filter((x) => x.clientId === c.id);
    return { ...c, revenue: r.reduce((s, x) => s + x.paidAmount, 0), count: r.length };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const maxClientRevenue = clientRevenue.length > 0 ? clientRevenue[0].revenue : 0;

  // Top vehicles
  const vehicleRevenue = vehicles.map((v) => {
    const r = rentals.filter((x) => x.vehicleId === v.id);
    return { ...v, revenue: r.reduce((s, x) => s + x.paidAmount, 0), count: r.length };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const maxVehicleRevenue = vehicleRevenue.length > 0 ? vehicleRevenue[0].revenue : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0f141f]/90 backdrop-blur-2xl border border-brand-green-500/20 rounded-2xl p-5 shadow-[0_10px_40px_rgba(34,197,94,0.15)]">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} className="text-brand-green-400" />
          <p className="text-slate-300 font-bold uppercase tracking-widest text-[11px]">{label}</p>
        </div>
        <p className="text-brand-green-400 font-black text-2xl drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]">{payload[0].value.toLocaleString("fr-FR")} MAD</p>
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
           <Activity size={12} className="text-slate-400" />
           <p className="text-slate-400 text-xs font-medium">{monthlyData.find(m => m.month === label)?.count} locations enregistrées</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Revenus & Trésorerie</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Analyse financière détaillée et performances globales</p>
        </div>
      </div>

      {/* KPIs Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel rounded-3xl p-6 border-brand-green-500/40 bg-brand-green-500/10 shadow-[0_8px_32px_rgba(34,197,94,0.2)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green-500/20 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] text-brand-green-300 uppercase font-bold tracking-widest">Total encaissé</p>
              <div className="p-2 bg-brand-green-500/20 rounded-lg border border-brand-green-500/30"><Banknote size={16} className="text-brand-green-400" /></div>
            </div>
            <div>
              <p className="text-4xl font-black text-brand-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]">{totalRevenue.toLocaleString("fr-FR")}</p>
              <p className="text-xs text-brand-green-500/80 font-bold mt-1 uppercase tracking-widest">MAD</p>
            </div>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">Solde en attente</p>
            <div className="p-2 bg-brand-orange-500/10 rounded-lg border border-brand-orange-500/20"><Clock size={16} className="text-brand-orange-400" /></div>
          </div>
          <div>
            <p className="text-3xl font-black text-brand-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">{totalPending.toLocaleString("fr-FR")}</p>
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">MAD DÛ</p>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">Moyenne / location</p>
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"><TrendingUp size={16} className="text-blue-400" /></div>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{Math.round(avgRental).toLocaleString("fr-FR")}</p>
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">MAD</p>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">Meilleur mois</p>
            <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20"><Trophy size={16} className="text-yellow-400" /></div>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{bestMonth.revenue > 0 ? bestMonth.fullMonth : "—"}</p>
            {bestMonth.revenue > 0 && <p className="text-xs text-yellow-400 font-bold mt-1 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">{bestMonth.revenue.toLocaleString("fr-FR")} MAD</p>}
          </div>
        </div>
      </div>

      {/* Bar chart & Mensual Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Graphique principal */}
        <div className="xl:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-lg font-bold text-white">Évolution des revenus</p>
              <p className="text-sm text-slate-400 mt-1 font-medium">{completedRentals.length} locations clôturées au total</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="revenue" radius={[6, 6, 6, 6]} maxBarSize={45}>
                  {monthlyData.map((m, i) => (
                    <Cell key={i} fill={m.month === bestMonth.month && m.revenue > 0 ? "#4ade80" : "#22c55e"} opacity={m.revenue > 0 ? 0.9 : 0.15} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tableau Récapitulatif Mois */}
        <div className="glass-panel rounded-3xl overflow-hidden flex flex-col">
          <div className="px-6 py-6 border-b border-white/5 bg-white/[0.01]">
            <p className="text-sm font-bold text-white flex items-center gap-2"><Calendar size={16} className="text-brand-green-400" /> Détail par mois</p>
          </div>
          <div className="divide-y divide-white/5 overflow-y-auto max-h-[350px] flex-1">
            {monthlyData.filter(m => m.revenue > 0).sort((a, b) => b.revenue - a.revenue).map((m) => (
              <div key={m.month} className="px-6 py-4 hover:bg-white/5 transition-colors group">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-white">{m.fullMonth}</p>
                  <p className="text-sm font-black text-brand-green-400 drop-shadow-sm">{m.revenue.toLocaleString("fr-FR")} MAD</p>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden shadow-inner mb-3">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-green-600 to-brand-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0}%` }} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {m.rentals.slice(0, 4).map((r) => (
                    <button key={r.id} onClick={() => router.push(`/locations/${r.id}`)}
                      className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-400 font-bold hover:text-white hover:border-brand-green-500/40 hover:bg-brand-green-500/20 font-mono transition-all">
                      {r.contractNum.split("-").pop()}
                    </button>
                  ))}
                  {m.rentals.length > 4 && <span className="text-[10px] text-slate-500 font-bold px-1 py-1">+{m.rentals.length - 4}</span>}
                </div>
              </div>
            ))}
            {completedRentals.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500 font-medium">Aucun revenu enregistré</div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="px-6 py-6 border-b border-white/5 bg-white/[0.01]">
            <p className="text-sm font-bold text-white flex items-center gap-2"><Users size={16} className="text-blue-400" /> Meilleurs Clients</p>
          </div>
          <div className="divide-y divide-white/5">
            {clientRevenue.filter(c => c.revenue > 0).map((c, i) => (
              <div key={c.id} className="p-6 hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4 mb-3 cursor-pointer" onClick={() => router.push(`/clients/${c.id}`)}>
                  <span className={cn("text-lg font-black w-5 flex-shrink-0 text-center", i===0?"text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]":i===1?"text-slate-300":i===2?"text-brand-orange-500":"text-slate-600")}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg border border-blue-500/20">{c.firstName[0]}{c.lastName[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-slate-400 font-medium">{c.count} location{c.count > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                     <p className="text-sm font-black text-brand-green-400 drop-shadow-sm">{c.revenue.toLocaleString("fr-FR")} MAD</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors ml-1 hidden sm:block" />
                </div>
                {/* Visual indicator bar */}
                <div className="pl-14 pr-7">
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" style={{ width: `${maxClientRevenue > 0 ? (c.revenue / maxClientRevenue) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top vehicles */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="px-6 py-6 border-b border-white/5 bg-white/[0.01]">
            <p className="text-sm font-bold text-white flex items-center gap-2"><Car size={16} className="text-brand-orange-400" /> Véhicules les plus rentables</p>
          </div>
          <div className="divide-y divide-white/5">
            {vehicleRevenue.map((v, i) => (
              <div key={v.id} className="p-6 hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4 mb-3 cursor-pointer" onClick={() => router.push(`/vehicules/${v.id}`)}>
                  <span className={cn("text-lg font-black w-5 flex-shrink-0 text-center", i===0?"text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]":i===1?"text-slate-300":i===2?"text-brand-orange-500":"text-slate-600")}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-xl glass-item flex items-center justify-center flex-shrink-0 shadow-sm"><Car size={18} className="text-brand-orange-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-brand-orange-400 transition-colors">{v.brand} {v.model}</p>
                    <p className="text-[11px] text-slate-400 font-mono font-bold mt-0.5">{v.plate} · {v.count} loc.</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                     <p className={cn("text-sm font-black drop-shadow-sm", v.revenue > 0 ? "text-brand-green-400" : "text-slate-500")}>{v.revenue.toLocaleString("fr-FR")} MAD</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-brand-orange-400 transition-colors ml-1 hidden sm:block" />
                </div>
                {/* Visual indicator bar */}
                <div className="pl-14 pr-7">
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" style={{ width: `${maxVehicleRevenue > 0 ? (v.revenue / maxVehicleRevenue) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}