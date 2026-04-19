"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Search, Plus, ShieldBan, Phone, Mail, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("fr-MA");
function Chevron() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>; }

export default function ClientsListePage() {
  const router = useRouter();
  const { clients, getRentalsByClient, getClientTotalSpent, deleteClient } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "BLACKLIST">("ALL");
  const [sort, setSort] = useState<"recent" | "spent" | "rentals" | "name">("recent");
  const [delId, setDelId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState("");

  const enriched = clients.map((c) => ({
    ...c,
    totalSpent:  getClientTotalSpent(c.id),
    rentalCount: getRentalsByClient(c.id).length,
    isActive:    getRentalsByClient(c.id).some((r) => r.status === "ACTIVE"),
  }));

  const filtered = enriched
    .filter((c) => {
      const q = search.toLowerCase();
      const match = `${c.firstName} ${c.lastName} ${c.cin} ${c.phone} ${c.email ?? ""} ${c.city ?? ""}`.toLowerCase().includes(q);
      const flt = filter === "ALL" || (filter === "ACTIVE" && !c.isBlacklist) || (filter === "BLACKLIST" && c.isBlacklist);
      return match && flt;
    })
    .sort((a, b) => {
      if (sort === "spent")   return b.totalSpent - a.totalSpent;
      if (sort === "rentals") return b.rentalCount - a.rentalCount;
      if (sort === "name")    return a.lastName.localeCompare(b.lastName);
      return b.createdAt.localeCompare(a.createdAt);
    });

  const confirmDelete = async () => {
    if (!delId) return;
    setDeleting(true); setDelError("");
    try {
      await deleteClient(delId);
      setDelId(null);
    } catch (e: any) {
      setDelError(e.message);
    } finally { setDeleting(false); }
  };

  const delTarget = delId ? enriched.find((c) => c.id === delId) : null;

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Clients</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">{clients.length} clients enregistrés · <span className="text-brand-green-400 font-bold">{fmt(enriched.reduce((s,c)=>s+c.totalSpent,0))} MAD</span> générés</p>
        </div>
        <Link href="/clients/nouveau">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-green-500/20 hover:bg-brand-green-500/30 border border-brand-green-500/30 text-brand-green-400 text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]">
            <Plus size={16} /> Nouveau client
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([ ["ALL","Total Clients",clients.length,"text-white"], ["ACTIVE","Clients Actifs",enriched.filter(c=>!c.isBlacklist).length,"text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"], ["BLACKLIST","Liste noire",enriched.filter(c=>c.isBlacklist).length,"text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"] ] as const).map(([f,l,v,col]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("glass-panel glass-panel-hover rounded-2xl p-5 text-left group", filter===f?"border-brand-green-500/30 bg-brand-green-500/10 shadow-[0_8px_32px_rgba(34,197,94,0.15)]":"")}>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{l}</p>
            <p className={cn("text-3xl font-black mt-2 transition-transform origin-left group-hover:scale-105",col)}>{v}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par nom, CIN, téléphone, ville..."
            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-white/[0.05] focus:border-brand-green-500/50 focus:shadow-[0_0_15px_rgba(34,197,94,0.15)] backdrop-blur-md transition-all" />
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value as any)}
          className="px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:bg-white/[0.05] focus:border-brand-green-500/50 backdrop-blur-md transition-all sm:w-48">
          <option value="recent" className="bg-[#0f141f]">Plus récents</option>
          <option value="spent" className="bg-[#0f141f]">+ Dépensé</option>
          <option value="rentals" className="bg-[#0f141f]">+ Locations</option>
          <option value="name" className="bg-[#0f141f]">De A à Z</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="glass-panel text-center py-12 text-slate-400 rounded-2xl font-medium">Aucun client trouvé pour cette recherche.</div>}
        {filtered.map((c) => (
          <div key={c.id} className={cn("glass-panel glass-panel-hover rounded-2xl p-4 flex items-center gap-4 group", c.isBlacklist?"border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-500/5":"")}>
            <button onClick={() => router.push(`/clients/${c.id}`)} className="flex items-center gap-5 flex-1 min-w-0 text-left">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black text-white shadow-lg",
                c.isBlacklist?"bg-red-500/20 text-red-400 border border-red-500/30":"bg-gradient-to-br from-brand-green-500 to-brand-green-700")}>
                {c.firstName[0]}{c.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <p className="text-base font-bold text-white">{c.firstName} {c.lastName}</p>
                  <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 border border-white/10 px-2 py-0.5 rounded-md shadow-sm">{c.cin}</span>
                  {c.isBlacklist && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]"><ShieldBan size={10}/>Blacklisté</span>}
                  {c.isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]">En location</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium flex-wrap">
                  <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-500"/>{c.phone}</span>
                  {c.email && <span className="hidden md:flex items-center gap-1.5"><Mail size={12} className="text-slate-500"/>{c.email}</span>}
                  {c.city && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-500"/>{c.city}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block mr-3">
                <p className="text-base font-black text-white drop-shadow-sm">{c.rentalCount} loc.</p>
                <p className="text-xs font-bold text-brand-green-400 mt-0.5">{fmt(c.totalSpent)} MAD</p>
              </div>
              <span className="text-slate-500 group-hover:text-brand-green-400 transition-colors flex-shrink-0"><Chevron/></span>
            </button>
            <button onClick={() => { setDelId(c.id); setDelError(""); }}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all flex-shrink-0 shadow-sm" title="Supprimer">
              <Trash2 size={16}/>
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!delId}
        title={delTarget ? `Supprimer ${delTarget.firstName} ${delTarget.lastName} ?` : ""}
        description={delError || "Toutes les locations et réservations associées seront supprimées. Action irréversible."}
        confirmLabel="Supprimer définitivement"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => { setDelId(null); setDelError(""); }}
      />
    </div>
  );
}