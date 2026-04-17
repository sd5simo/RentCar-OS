"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/store";
import { TrendingUp, Car, Calendar, ChevronRight } from "lucide-react";
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

  // Top vehicles
  const vehicleRevenue = vehicles.map((v) => {
    const r = rentals.filter((x) => x.vehicleId === v.id);
    return { ...v, revenue: r.reduce((s, x) => s + x.paidAmount, 0), count: r.length };
  }).sort((a, b) => b.revenue - a.revenue);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-xs shadow-xl">
        <p className="text-slate-300 font-semibold mb-1">{label}</p>
        <p className="text-brand-green-400 font-bold">{payload[0].value.toLocaleString("fr-FR")} MAD</p>
        <p className="text-slate-500">{monthlyData.find(m => m.month === label)?.count} locations</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenus</h1>
        <p className="text-slate-500 text-sm mt-0.5">Analyse financière — données en temps réel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-brand-green-500/25 bg-[#161b22] p-5 shadow-[0_0_20px_rgba(34,197,94,0.06)]">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Total encaissé</p>
          <p className="text-3xl font-bold text-brand-green-400">{totalRevenue.toLocaleString("fr-FR")}</p>
          <p className="text-sm text-slate-500 mt-1">MAD</p>
        </div>
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Solde en attente</p>
          <p className="text-3xl font-bold text-brand-orange-400">{totalPending.toLocaleString("fr-FR")}</p>
          <p className="text-sm text-slate-500 mt-1">MAD dû</p>
        </div>
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Moyenne / location</p>
          <p className="text-3xl font-bold text-white">{Math.round(avgRental).toLocaleString("fr-FR")}</p>
          <p className="text-sm text-slate-500 mt-1">MAD</p>
        </div>
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Meilleur mois</p>
          <p className="text-3xl font-bold text-white">{bestMonth.revenue > 0 ? bestMonth.fullMonth : "—"}</p>
          {bestMonth.revenue > 0 && <p className="text-sm text-brand-green-400 font-semibold mt-1">{bestMonth.revenue.toLocaleString("fr-FR")} MAD</p>}
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-slate-200">Revenus mensuels</p>
          <p className="text-xs text-slate-500">{completedRentals.length} locations au total</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {monthlyData.map((m, i) => (
                <Cell key={i} fill={m.month === bestMonth.month && m.revenue > 0 ? "#22c55e" : "#16a34a"} opacity={m.revenue > 0 ? 0.85 : 0.2} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#21262d]">
          <p className="text-sm font-bold text-slate-200">Détail mensuel — cliquez pour voir les locations</p>
        </div>
        <div className="divide-y divide-[#21262d]">
          {monthlyData.filter(m => m.revenue > 0).sort((a, b) => b.revenue - a.revenue).map((m) => (
            <div key={m.month} className="px-5 py-3 hover:bg-[#1c2130] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-24 flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-200">{m.fullMonth}</p>
                  <p className="text-xs text-slate-500">{m.count} location{m.count > 1 ? "s" : ""}</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-[#0d1117] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand-green-500 transition-all" style={{ width: `${maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0}%` }} />
                  </div>
                </div>
                <p className="text-sm font-bold text-brand-green-400 w-36 text-right">{m.revenue.toLocaleString("fr-FR")} MAD</p>
                <div className="flex gap-1">
                  {m.rentals.slice(0, 3).map((r) => (
                    <button key={r.id} onClick={() => router.push(`/locations/${r.id}`)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c2130] border border-[#21262d] text-slate-500 hover:text-brand-green-400 hover:border-brand-green-500/30 font-mono transition-colors">
                      {r.contractNum.split("-").pop()}
                    </button>
                  ))}
                  {m.rentals.length > 3 && <span className="text-[10px] text-slate-600">+{m.rentals.length - 3}</span>}
                </div>
              </div>
            </div>
          ))}
          {completedRentals.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-600">Aucun revenu enregistré</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top clients */}
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#21262d]"><p className="text-sm font-bold text-slate-200">Top clients par CA</p></div>
          <div className="divide-y divide-[#21262d]">
            {clientRevenue.filter(c => c.revenue > 0).map((c, i) => (
              <button key={c.id} onClick={() => router.push(`/clients/${c.id}`)}
                className="w-full text-left px-5 py-3 hover:bg-[#1c2130] transition-colors group flex items-center gap-3">
                <span className="text-sm font-bold text-slate-600 w-4 flex-shrink-0">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-green-600 to-brand-green-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{c.firstName[0]}{c.lastName[0]}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-slate-500">{c.count} location{c.count > 1 ? "s" : ""}</p>
                </div>
                <p className="text-sm font-bold text-brand-green-400">{c.revenue.toLocaleString("fr-FR")} MAD</p>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 group-hover:text-brand-green-400"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Top vehicles */}
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#21262d]"><p className="text-sm font-bold text-slate-200">Performance des véhicules</p></div>
          <div className="divide-y divide-[#21262d]">
            {vehicleRevenue.map((v, i) => (
              <button key={v.id} onClick={() => router.push(`/vehicules/${v.id}`)}
                className="w-full text-left px-5 py-3 hover:bg-[#1c2130] transition-colors group flex items-center gap-3">
                <span className="text-sm font-bold text-slate-600 w-4 flex-shrink-0">{i + 1}</span>
                <Car size={16} className="text-slate-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200">{v.brand} {v.model}</p>
                  <p className="text-xs text-slate-500 font-mono">{v.plate} · {v.count} loc.</p>
                </div>
                <p className={cn("text-sm font-bold", v.revenue > 0 ? "text-brand-green-400" : "text-slate-600")}>{v.revenue.toLocaleString("fr-FR")} MAD</p>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 group-hover:text-brand-green-400"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
