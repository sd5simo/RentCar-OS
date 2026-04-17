"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Car, User, Calendar, Clock, CheckCircle, Trash2, Filter, X } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

function Chevron(){return(<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);}

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

    // Date range filter: show rentals that OVERLAP the selected period
    let matchDate = true;
    if (dateFrom || dateTo) {
      const rStart = r.startDate;
      const rEnd   = r.endDate;
      if (dateFrom && dateTo) {
        // Rental overlaps [dateFrom, dateTo]
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
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Locations</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {rentals.length} contrats · {totalRevenue.toLocaleString("fr-FR")} MAD encaissé
          </p>
        </div>
        <Link href="/locations/nouveau">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus size={15} /> Nouvelle location
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { f:"ALL",    l:"Toutes",          v:rentals.length,                                          c:"text-white" },
          { f:"ACTIVE", l:"En cours",        v:rentals.filter(r=>r.status==="ACTIVE").length,           c:"text-blue-400" },
          { f:"COMPLETED",l:"Terminées",     v:rentals.filter(r=>r.status==="COMPLETED").length,        c:"text-brand-green-400" },
          { f:null,     l:"Solde en attente",v:`${pending.toLocaleString("fr-FR")} MAD`,                c:pending>0?"text-brand-orange-400":"text-brand-green-400" },
        ].map((s) => (
          <button key={s.l} onClick={() => s.f && setFilter(s.f)}
            className={cn("rounded-xl border bg-[#161b22] p-4 text-left transition-all", filter===s.f?"border-brand-green-500/40":"border-[#21262d] hover:border-[#30363d]")}>
            <p className="text-xs text-slate-500">{s.l}</p>
            <p className={cn("text-xl font-bold mt-1", s.c)}>{s.v}</p>
          </button>
        ))}
      </div>

      {/* Search + date filter toggle */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Contrat, client, plaque..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-green-500/50 transition-all" />
        </div>
        <button onClick={() => setShowDateFilter(!showDateFilter)}
          className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors",
            hasDateFilter ? "bg-brand-green-500/10 text-brand-green-400 border-brand-green-500/30" : "bg-[#161b22] text-slate-400 border-[#30363d] hover:text-slate-200")}>
          <Filter size={14} />
          Filtrer par période
          {hasDateFilter && <span className="w-1.5 h-1.5 rounded-full bg-brand-green-400" />}
        </button>
        {(["ALL","ACTIVE","COMPLETED","CANCELLED"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={cn("px-3 py-2 rounded-lg text-xs font-semibold border transition-colors",
              filter===f?"bg-brand-green-500/10 text-brand-green-400 border-brand-green-500/20":"bg-[#161b22] text-slate-500 border-[#21262d] hover:text-slate-300")}>
            {f==="ALL"?"Tous":f==="ACTIVE"?"En cours":f==="COMPLETED"?"Terminés":"Annulés"}
          </button>
        ))}
      </div>

      {/* Date range panel */}
      {showDateFilter && (
        <div className="rounded-xl border border-brand-green-500/20 bg-[#161b22] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Calendar size={14} className="text-brand-green-400" />
              Filtrer par période
            </p>
            {hasDateFilter && (
              <button onClick={()=>{setDateFrom("");setDateTo("");}}
                className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                <X size={11}/>Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Date de début</label>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Date de fin</label>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50" />
            </div>
          </div>
          {hasDateFilter && (
            <p className="text-xs text-slate-500 mt-2">
              <span className="text-brand-green-400 font-semibold">{filtered.length}</span> location(s) dans cette période
            </p>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-600 rounded-xl border border-[#21262d] bg-[#161b22]">
            {hasDateFilter ? "Aucune location dans cette période" : "Aucune location trouvée"}
          </div>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 flex items-center gap-3 hover:bg-[#1c2130] transition-all group hover:border-brand-green-500/25">
            <button onClick={() => router.push(`/locations/${r.id}`)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                r.status==="ACTIVE"?"bg-blue-500/15 border border-blue-500/20":"bg-brand-green-500/15 border border-brand-green-500/20")}>
                {r.status==="ACTIVE"?<Clock size={18} className="text-blue-400"/>:<CheckCircle size={18} className="text-brand-green-400"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-slate-200 font-mono">{r.contractNum}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    r.status==="ACTIVE"?"text-blue-400 bg-blue-500/10 border-blue-500/20":"text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20")}>
                    {r.status==="ACTIVE"?"En cours":"Terminé"}
                  </span>
                  {(r.totalAmount-r.paidAmount)>0&&(
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange-500/15 text-brand-orange-400 border border-brand-orange-500/20">
                      {(r.totalAmount-r.paidAmount).toLocaleString("fr-FR")} MAD dû
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><User size={10}/>{r.client?.firstName} {r.client?.lastName}</span>
                  <span className="flex items-center gap-1"><Car size={10}/>{r.vehicle?.brand} {r.vehicle?.model} · {r.vehicle?.plate}</span>
                  <span className="flex items-center gap-1"><Calendar size={10}/>{r.startDate} → {r.endDate}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block mr-2">
                <p className="text-base font-bold text-white">{r.totalAmount.toLocaleString("fr-FR")} MAD</p>
                <p className="text-xs text-slate-500">{r.totalDays}j × {r.dailyRate} MAD</p>
              </div>
              <span className="text-slate-600 group-hover:text-brand-green-400 flex-shrink-0"><Chevron/></span>
            </button>
            <button onClick={()=>{setDelId(r.id);setDelError("");}}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0" title="Supprimer">
              <Trash2 size={14}/>
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
