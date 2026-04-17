"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, Car, User, ArrowRight, Filter, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

const STATUS_CFG: Record<string,{l:string;c:string}> = {
  CONFIRMED:{l:"Confirmée", c:"text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20"},
  PENDING:  {l:"En attente",c:"text-yellow-400 bg-yellow-500/10 border-yellow-500/20"},
  CANCELLED:{l:"Annulée",   c:"text-red-400 bg-red-500/10 border-red-500/20"},
  CONVERTED:{l:"Convertie", c:"text-purple-400 bg-purple-500/10 border-purple-500/20"},
};

function Chevron(){return(<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);}

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
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Réservations</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {reservations.length} réservations · {reservations.filter(r=>r.status==="PENDING"||r.status==="CONFIRMED").length} actives
          </p>
        </div>
        <Link href="/reservations/nouveau">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus size={15} /> Nouvelle réservation
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {([
          ["ALL","Toutes",reservations.length,"text-white"],
          ["CONFIRMED","Confirmées",reservations.filter(r=>r.status==="CONFIRMED").length,"text-brand-green-400"],
          ["PENDING","En attente",reservations.filter(r=>r.status==="PENDING").length,"text-yellow-400"],
          ["CANCELLED","Annulées",reservations.filter(r=>r.status==="CANCELLED").length,"text-red-400"],
        ] as const).map(([f,l,v,c])=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={cn("rounded-xl border bg-[#161b22] p-4 text-left transition-all",filter===f?"border-brand-green-500/40":"border-[#21262d] hover:border-[#30363d]")}>
            <p className="text-xs text-slate-500">{l}</p><p className={cn("text-xl font-bold mt-1",c)}>{v}</p>
          </button>
        ))}
      </div>

      {/* Search + date filter toggle */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Référence, client, plaque..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-green-500/50 transition-all"/>
        </div>
        <button onClick={()=>setShowDateFilter(!showDateFilter)}
          className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors",
            hasDateFilter?"bg-brand-green-500/10 text-brand-green-400 border-brand-green-500/30":"bg-[#161b22] text-slate-400 border-[#30363d] hover:text-slate-200")}>
          <Filter size={14}/>Filtrer par période
          {hasDateFilter&&<span className="w-1.5 h-1.5 rounded-full bg-brand-green-400"/>}
        </button>
      </div>

      {/* Date range panel */}
      {showDateFilter && (
        <div className="rounded-xl border border-brand-green-500/20 bg-[#161b22] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Calendar size={14} className="text-brand-green-400"/>Filtrer par période
            </p>
            {hasDateFilter&&(
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
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Date de fin</label>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50"/>
            </div>
          </div>
          {hasDateFilter&&(
            <p className="text-xs text-slate-500 mt-2">
              <span className="text-brand-green-400 font-semibold">{filtered.length}</span> réservation(s) dans cette période
            </p>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length===0&&(
          <div className="text-center py-12 text-slate-600 rounded-xl border border-[#21262d] bg-[#161b22]">
            {hasDateFilter?"Aucune réservation dans cette période":"Aucune réservation trouvée"}
          </div>
        )}
        {filtered.map((r)=>{
          const cfg=STATUS_CFG[r.status];const days=Math.ceil((new Date(r.endDate).getTime()-new Date(r.startDate).getTime())/86400000);
          return(
            <div key={r.id} className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-[#30363d] transition-all">
              <div className="flex items-center gap-4">
                <button onClick={()=>router.push(`/reservations/${r.id}`)} className="flex items-center gap-4 flex-1 min-w-0 text-left group">
                  <span className={cn("flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border",cfg.c)}>{cfg.l}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-brand-green-400 font-mono">{r.refCode}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><User size={10}/>{r.client?.firstName} {r.client?.lastName}</span>
                      <span className="flex items-center gap-1"><Car size={10}/>{r.vehicle?.brand} {r.vehicle?.model} · {r.vehicle?.plate}</span>
                      <span className="flex items-center gap-1"><Calendar size={10}/>{r.startDate} → {r.endDate} ({days}j)</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white flex-shrink-0 hidden sm:block mr-2">
                    {r.totalAmount.toLocaleString("fr-FR")} MAD
                  </p>
                </button>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.status==="PENDING"&&(
                    <>
                      <button onClick={()=>handleConfirm(r.id)} disabled={actionLoading===r.id}
                        className="text-xs px-2 py-1 rounded-lg bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20 hover:bg-brand-green-500/20 transition-colors disabled:opacity-50">
                        Confirmer
                      </button>
                      <button onClick={()=>handleCancel(r.id)} disabled={actionLoading===r.id}
                        className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                        Annuler
                      </button>
                    </>
                  )}
                  {r.status==="CONFIRMED"&&(
                    <Link href="/locations/nouveau">
                      <button className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                        <ArrowRight size={10}/>→ Location
                      </button>
                    </Link>
                  )}
                  <button onClick={()=>router.push(`/reservations/${r.id}`)}
                    className="text-slate-600 hover:text-brand-green-400 transition-colors">
                    <Chevron/>
                  </button>
                  <button onClick={()=>{setDelId(r.id);setDelError("");}}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Supprimer">
                    <Trash2 size={14}/>
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
