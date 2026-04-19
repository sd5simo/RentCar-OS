"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, Car, User, ArrowRight, Filter, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

const STATUS_CFG: Record<string,{l:string;c:string}> = {
  CONFIRMED:{l:"Confirmée", c:"text-brand-green-400 bg-brand-green-500/20 border-brand-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]"},
  PENDING:  {l:"En attente",c:"text-yellow-400 bg-yellow-500/20 border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]"},
  CANCELLED:{l:"Annulée",   c:"text-red-400 bg-red-500/20 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"},
  CONVERTED:{l:"Convertie", c:"text-purple-400 bg-purple-500/20 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"},
};

function Chevron(){return(<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);}

export default function ReservationsListePage() {
  const router = useRouter();
  const { reservations, clients, vehicles, confirmReservation, cancelReservation, deleteReservation } = useStore();

  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("ALL");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [delId, setDelId]         = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const [delError, setDelError]   = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const enriched = reservations.map((r) => ({
    ...r,
    client:  clients.find((c) => c.id === r.clientId),
    vehicle: vehicles.find((v) => v.id === r.vehicleId),
  }));

  const filtered = enriched.filter((r) => {
    const str = `${r.refCode} ${r.client?.firstName} ${r.client?.lastName} ${r.vehicle?.plate}`.toLowerCase();
    const matchSearch = str.includes(search.toLowerCase());
    const matchStatus = filter === "ALL" || r.status === filter;
    let matchDate = true;
    if (dateFrom || dateTo) {
      const rStart = r.startDate; const rEnd = r.endDate;
      if (dateFrom && dateTo) matchDate = rStart <= dateTo && rEnd >= dateFrom;
      else if (dateFrom)       matchDate = rEnd >= dateFrom;
      else if (dateTo)         matchDate = rStart <= dateTo;
    }
    return matchSearch && matchStatus && matchDate;
  }).sort((a,b) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());

  const hasDateFilter = dateFrom || dateTo;

  const handleConfirm = async (id: string) => {
    setActionLoading(id);
    try { await confirmReservation(id); } finally { setActionLoading(null); }
  };
  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try { await cancelReservation(id); } finally { setActionLoading(null); }
  };
  const confirmDelete = async () => {
    if (!delId) return;
    setDeleting(true); setDelError("");
    try { await deleteReservation(delId); setDelId(null); }
    catch (e: any) { setDelError(e.message); }
    finally { setDeleting(false); }
  };

  const delTarget = delId ? enriched.find((r) => r.id === delId) : null;

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Réservations</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">
            {reservations.length} réservations · <span className="text-brand-green-400 font-bold">{reservations.filter(r=>r.status==="PENDING"||r.status==="CONFIRMED").length}</span> actives
          </p>
        </div>
        <Link href="/reservations/nouveau">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-green-500/20 hover:bg-brand-green-500/30 border border-brand-green-500/30 text-brand-green-400 text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]">
            <Plus size={16} /> Nouvelle réservation
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          ["ALL","Toutes",reservations.length,"text-white"],
          ["CONFIRMED","Confirmées",reservations.filter(r=>r.status==="CONFIRMED").length,"text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"],
          ["PENDING","En attente",reservations.filter(r=>r.status==="PENDING").length,"text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"],
          ["CANCELLED","Annulées",reservations.filter(r=>r.status==="CANCELLED").length,"text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"],
        ] as const).map(([f,l,v,c])=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={cn("glass-panel glass-panel-hover rounded-2xl p-5 text-left group",filter===f?"border-brand-green-500/30 bg-brand-green-500/10 shadow-[0_8px_32px_rgba(34,197,94,0.15)]":"")}>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{l}</p>
            <p className={cn("text-3xl font-black mt-2 transition-transform origin-left group-hover:scale-105",c)}>{v}</p>
          </button>
        ))}
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Référence, client, plaque..."
            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-white/[0.05] focus:border-brand-green-500/50 focus:shadow-[0_0_15px_rgba(34,197,94,0.15)] backdrop-blur-md transition-all"/>
        </div>
        <button onClick={()=>setShowDateFilter(!showDateFilter)}
          className={cn("flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors backdrop-blur-md",
            hasDateFilter?"bg-brand-green-500/20 text-brand-green-400 border-brand-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]":"bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.06]")}>
          <Filter size={16}/>Filtrer par période
          {hasDateFilter&&<span className="w-2 h-2 rounded-full bg-brand-green-400 shadow-[0_0_8px_#4ade80]"/>}
        </button>
      </div>

      {/* Date range panel */}
      {showDateFilter && (
        <div className="glass-panel rounded-2xl p-5 border-brand-green-500/30 shadow-[0_8px_32px_rgba(34,197,94,0.1)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-brand-green-400"/>Filtrer par période
            </p>
            {hasDateFilter&&(
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
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 transition-colors color-scheme-dark"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Date de fin</label>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-green-500/50 transition-colors color-scheme-dark"/>
            </div>
          </div>
          {hasDateFilter&&(
            <p className="text-xs text-slate-400 mt-3 font-medium">
              <span className="text-brand-green-400 font-bold">{filtered.length}</span> réservation(s) dans cette période
            </p>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.length===0&&(
          <div className="glass-panel text-center py-12 text-slate-400 rounded-2xl font-medium">
            {hasDateFilter?"Aucune réservation dans cette période":"Aucune réservation trouvée"}
          </div>
        )}
        {filtered.map((r)=>{
          const cfg=STATUS_CFG[r.status];const days=Math.ceil((new Date(r.endDate).getTime()-new Date(r.startDate).getTime())/86400000);
          return(
            <div key={r.id} className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all">
              <div className="flex items-center gap-4">
                <button onClick={()=>router.push(`/reservations/${r.id}`)} className="flex items-center gap-5 flex-1 min-w-0 text-left group">
                  <span className={cn("flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border",cfg.c)}>{cfg.l}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-white font-mono">{r.refCode}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium flex-wrap">
                      <span className="flex items-center gap-1.5"><User size={12}/>{r.client?.firstName} {r.client?.lastName}</span>
                      <span className="flex items-center gap-1.5"><Car size={12}/>{r.vehicle?.brand} {r.vehicle?.model} · {r.vehicle?.plate}</span>
                      <span className="flex items-center gap-1.5"><Calendar size={12}/>{r.startDate} → {r.endDate} ({days}j)</span>
                    </div>
                  </div>
                  <p className="text-base font-black text-white flex-shrink-0 hidden sm:block mr-3 drop-shadow-sm">
                    {r.totalAmount.toLocaleString("fr-FR")} MAD
                  </p>
                </button>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.status==="PENDING"&&(
                    <>
                      <button onClick={()=>handleConfirm(r.id)} disabled={actionLoading===r.id}
                        className="text-xs font-bold px-3 py-2 rounded-xl bg-brand-green-500/20 text-brand-green-400 border border-brand-green-500/30 hover:bg-brand-green-500/30 transition-colors disabled:opacity-50">
                        Confirmer
                      </button>
                      <button onClick={()=>handleCancel(r.id)} disabled={actionLoading===r.id}
                        className="text-xs font-bold px-3 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50">
                        Annuler
                      </button>
                    </>
                  )}
                  {r.status==="CONFIRMED"&&(
                    <Link href="/locations/nouveau">
                      <button className="text-xs font-bold px-3 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors flex items-center gap-1">
                        <ArrowRight size={12}/>→ Location
                      </button>
                    </Link>
                  )}
                  <button onClick={()=>router.push(`/reservations/${r.id}`)}
                    className="text-slate-500 hover:text-brand-green-400 transition-colors p-2">
                    <Chevron/>
                  </button>
                  <button onClick={()=>{setDelId(r.id);setDelError("");}}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all shadow-sm" title="Supprimer">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={!!delId}
        title={delTarget?`Supprimer la réservation ${delTarget.refCode} ?`:""}
        description={delError||"Cette réservation sera définitivement supprimée. Action irréversible."}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={()=>{setDelId(null);setDelError("");}}
      />
    </div>
  );
}