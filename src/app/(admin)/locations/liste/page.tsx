"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Car, User, Calendar, Clock, CheckCircle, Trash2, Filter, X } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

function Chevron(){return(<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);}

export default function LocationsListePage() {
  const router = useRouter();
  const { rentals, clients, vehicles, deleteRental } = useStore();

  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("ALL");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [delId, setDelId]         = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const [delError, setDelError]   = useState("");

  const enriched = rentals.map((r) => ({
    ...r,
    client:  clients.find((c) => c.id === r.clientId),
    vehicle: vehicles.find((v) => v.id === r.vehicleId),
  }));

  const filtered = enriched.filter((r) => {
    const str = `${r.contractNum} ${r.client?.firstName} ${r.client?.lastName} ${r.vehicle?.plate}`.toLowerCase();
    const matchSearch = str.includes(search.toLowerCase());
    const matchStatus = filter === "ALL" || r.status === filter;

    let matchDate = true;
    if (dateFrom || dateTo) {
      const rStart = r.startDate;
      const rEnd   = r.endDate;
      if (dateFrom && dateTo) {
        matchDate = rStart <= dateTo && rEnd >= dateFrom;
      } else if (dateFrom) {
        matchDate = rEnd >= dateFrom;
      } else if (dateTo) {
        matchDate = rStart <= dateTo;
      }
    }
    return matchSearch && matchStatus && matchDate;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalRevenue = rentals.reduce((s, r) => s + r.paidAmount, 0);
  const pending      = rentals.reduce((s, r) => s + (r.totalAmount - r.paidAmount), 0);
  const hasDateFilter = dateFrom || dateTo;

  const confirmDelete = async () => {
    if (!delId) return;
    setDeleting(true); setDelError("");
    try { await deleteRental(delId); setDelId(null); }
    catch (e: any) { setDelError(e.message); }
    finally { setDeleting(false); }
  };

  const delTarget = delId ? enriched.find((r) => r.id === delId) : null;

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Locations</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">
            {rentals.length} contrats · <span className="text-brand-green-400 font-bold">{totalRevenue.toLocaleString("fr-FR")} MAD</span> encaissé
          </p>
        </div>
        <Link href="/locations/nouveau">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-green-500/20 hover:bg-brand-green-500/30 border border-brand-green-500/30 text-brand-green-400 text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]">
            <Plus size={16} /> Nouvelle location
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { f:"ALL",    l:"Toutes",          v:rentals.length,                                          c:"text-white" },
          { f:"ACTIVE", l:"En cours",        v:rentals.filter(r=>r.status==="ACTIVE").length,           c:"text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" },
          { f:"COMPLETED",l:"Terminées",     v:rentals.filter(r=>r.status==="COMPLETED").length,        c:"text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" },
          { f:null,     l:"Solde en attente",v:`${pending.toLocaleString("fr-FR")} MAD`,                c:pending>0?"text-brand-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]":"text-brand-green-400" },
        ].map((s) => (
          <button key={s.l} onClick={() => s.f && setFilter(s.f)}
            className={cn("glass-panel glass-panel-hover rounded-2xl p-5 text-left group", filter===s.f?"border-brand-green-500/30 bg-brand-green-500/10 shadow-[0_8px_32px_rgba(34,197,94,0.15)]":"")}>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{s.l}</p>
            <p className={cn("text-2xl sm:text-3xl font-black mt-2 transition-transform origin-left group-hover:scale-105", s.c)}>{s.v}</p>
          </button>
        ))}
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Contrat, client, plaque..."
            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-white/[0.05] focus:border-brand-green-500/50 focus:shadow-[0_0_15px_rgba(34,197,94,0.15)] backdrop-blur-md transition-all" />
        </div>
        <button onClick={() => setShowDateFilter(!showDateFilter)}
          className={cn("flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors backdrop-blur-md",
            hasDateFilter ? "bg-brand-green-500/20 text-brand-green-400 border-brand-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]" : "bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.06]")}>
          <Filter size={16} />
          Filtrer par période
          {hasDateFilter && <span className="w-2 h-2 rounded-full bg-brand-green-400 shadow-[0_0_8px_#4ade80]" />}
        </button>
        {(["ALL","ACTIVE","COMPLETED","CANCELLED"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={cn("px-4 py-3 rounded-xl text-xs font-bold border transition-colors backdrop-blur-md uppercase tracking-wider",
              filter===f?"bg-brand-green-500/20 text-brand-green-400 border-brand-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]":"bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06] hover:text-slate-200")}>
            {f==="ALL"?"Tous":f==="ACTIVE"?"En cours":f==="COMPLETED"?"Terminés":"Annulés"}
          </button>
        ))}
      </div>

      {/* Date range panel */}
      {showDateFilter && (
        <div className="glass-panel rounded-2xl p-5 border-brand-green-500/30 shadow-[0_8px_32px_rgba(34,197,94,0.1)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-brand-green-400" />
              Filtrer par période
            </p>
            {hasDateFilter && (
              <button onClick={()=>{setDateFrom("");setDateTo("");}}
                className="text-xs font-semibold text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors bg-white/5 hover:bg-red-500/10 px-2 py-1 rounded-md">
                <X size={12}/>Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Date de début</label>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 transition-colors color-scheme-dark" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Date de fin</label>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 transition-colors color-scheme-dark" />
            </div>
          </div>
          {hasDateFilter && (
            <p className="text-xs text-slate-400 mt-3 font-medium">
              <span className="text-brand-green-400 font-bold">{filtered.length}</span> location(s) trouvée(s) dans cette période
            </p>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass-panel text-center py-12 text-slate-400 rounded-2xl font-medium">
            {hasDateFilter ? "Aucune location dans cette période" : "Aucune location trouvée"}
          </div>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="glass-panel glass-panel-hover rounded-2xl p-4 flex items-center gap-4 group">
            <button onClick={() => router.push(`/locations/${r.id}`)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-md border shadow-sm",
                r.status==="ACTIVE"?"bg-blue-500/20 border-blue-500/30 text-blue-400":"bg-brand-green-500/20 border-brand-green-500/30 text-brand-green-400")}>
                {r.status==="ACTIVE"?<Clock size={20}/>:<CheckCircle size={20}/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm font-bold text-white font-mono">{r.contractNum}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm",
                    r.status==="ACTIVE"?"text-blue-400 bg-blue-500/20 border-blue-500/30":"text-brand-green-400 bg-brand-green-500/20 border-brand-green-500/30")}>
                    {r.status==="ACTIVE"?"En cours":"Terminé"}
                  </span>
                  {(r.totalAmount-r.paidAmount)>0&&(
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange-500/20 text-brand-orange-400 border border-brand-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.2)]">
                      {(r.totalAmount-r.paidAmount).toLocaleString("fr-FR")} MAD dû
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium flex-wrap">
                  <span className="flex items-center gap-1.5"><User size={12}/>{r.client?.firstName} {r.client?.lastName}</span>
                  <span className="flex items-center gap-1.5"><Car size={12}/>{r.vehicle?.brand} {r.vehicle?.model} · {r.vehicle?.plate}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={12}/>{r.startDate} → {r.endDate}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block mr-3">
                <p className="text-base font-black text-white drop-shadow-sm">{r.totalAmount.toLocaleString("fr-FR")} MAD</p>
                <p className="text-xs text-slate-400 font-medium">{r.totalDays}j × {r.dailyRate} MAD</p>
              </div>
              <span className="text-slate-500 group-hover:text-brand-green-400 flex-shrink-0 transition-colors"><Chevron/></span>
            </button>
            <button onClick={()=>{setDelId(r.id);setDelError("");}}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all flex-shrink-0 shadow-sm" title="Supprimer">
              <Trash2 size={16}/>
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!delId}
        title={delTarget?`Supprimer le contrat ${delTarget.contractNum} ?`:""}
        description={delError||"Cette location sera définitivement supprimée. Clôturez-la d'abord si elle est active."}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={()=>{setDelId(null);setDelError("");}}
      />
    </div>
  );
}