"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Search, Plus, ShieldBan, Phone, Mail, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("fr-MA");
function Chevron() { return <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>; }

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
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clients.length} clients · {fmt(enriched.reduce((s,c)=>s+c.totalSpent,0))} MAD total encaissé</p>
        </div>
        <Link href="/clients/nouveau">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus size={15} /> Nouveau client
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([ ["ALL","Total",clients.length,"text-white"], ["ACTIVE","Actifs",enriched.filter(c=>!c.isBlacklist).length,"text-brand-green-400"], ["BLACKLIST","Liste noire",enriched.filter(c=>c.isBlacklist).length,"text-red-400"] ] as const).map(([f,l,v,col]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-xl border bg-[#161b22] p-4 text-left transition-all", filter===f?"border-brand-green-500/40 bg-brand-green-500/5":"border-[#21262d] hover:border-[#30363d]")}>
            <p className="text-xs text-slate-500">{l}</p><p className={cn("text-2xl font-bold mt-1",col)}>{v}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, CIN, téléphone, ville..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-green-500/50 transition-all" />
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value as any)}
          className="px-3 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-300 focus:outline-none">
          <option value="recent">Récents</option><option value="spent">+ Dépensé</option>
          <option value="rentals">+ Locations</option><option value="name">A → Z</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <div className="text-center py-12 text-slate-600 rounded-xl border border-[#21262d] bg-[#161b22]">Aucun client trouvé</div>}
        {filtered.map((c) => (
          <div key={c.id} className={cn("rounded-xl border bg-[#161b22] p-4 flex items-center gap-3 hover:bg-[#1c2130] transition-all group", c.isBlacklist?"border-red-500/20":"border-[#21262d] hover:border-brand-green-500/25")}>
            <button onClick={() => router.push(`/clients/${c.id}`)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white",
                c.isBlacklist?"bg-red-700/60 border-2 border-red-500/40":"bg-gradient-to-br from-brand-green-600 to-brand-green-900")}>
                {c.firstName[0]}{c.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-bold text-slate-100">{c.firstName} {c.lastName}</p>
                  <span className="text-[11px] font-mono text-slate-500 bg-[#0d1117] px-1.5 py-0.5 rounded">{c.cin}</span>
                  {c.isBlacklist && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20"><ShieldBan size={9}/>Blacklisté</span>}
                  {c.isActive && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">En location</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Phone size={10}/>{c.phone}</span>
                  {c.email && <span className="hidden md:flex items-center gap-1"><Mail size={10}/>{c.email}</span>}
                  {c.city && <span className="flex items-center gap-1"><MapPin size={10}/>{c.city}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block mr-2">
                <p className="text-sm font-bold text-white">{c.rentalCount} loc.</p>
                <p className="text-xs text-brand-green-400">{fmt(c.totalSpent)} MAD</p>
              </div>
              <span className="text-slate-600 group-hover:text-brand-green-400 transition-colors flex-shrink-0"><Chevron/></span>
            </button>
            <button onClick={() => { setDelId(c.id); setDelError(""); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0" title="Supprimer">
              <Trash2 size={14}/>
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
