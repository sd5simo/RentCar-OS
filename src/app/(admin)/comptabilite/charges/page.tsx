"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Wrench, Shield, Droplets, Package, Search } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const CAT: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  MAINTENANCE: { label: "Maintenance", icon: <Wrench size={12} />,  color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  REPAIR:      { label: "Réparation",  icon: <Wrench size={12} />,  color: "text-red-400 bg-red-500/10 border-red-500/20" },
  INSURANCE:   { label: "Assurance",   icon: <Shield size={12} />,  color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  CLEANING:    { label: "Nettoyage",   icon: <Droplets size={12} />,color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  FUEL:        { label: "Carburant",   icon: <Droplets size={12} />,color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  OTHER:       { label: "Autre",       icon: <Package size={12} />, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

export default function ChargesPage() {
  // 1. Safe destructuring with fallback arrays to prevent .filter crashes
  const { expenses = [], vehicles = [], addExpense, updateExpense, deleteExpense } = useStore();
  
  // 2. Hydration fix: prevent rendering dates on the server
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ 
    category: "MAINTENANCE", 
    description: "", 
    amount: "", 
    date: "", // Initialized empty, set on mount/open
    vendor: "", 
    vehicleId: "" 
  });

  const filtered = expenses.filter((e) => {
    const str = `${e.description} ${e.vendor ?? ""}`.toLowerCase();
    return str.includes(search.toLowerCase()) && (filterCat === "ALL" || e.category === filterCat);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalAll = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const resetForm = () => { 
    setForm({ 
      category: "MAINTENANCE", 
      description: "", 
      amount: "", 
      date: new Date().toISOString().slice(0, 10), 
      vendor: "", 
      vehicleId: "" 
    }); 
    setEditingId(null); 
    setShowForm(false); 
  };

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.date) return;
    
    const data = { 
      category: form.category, 
      description: form.description, 
      amount: parseFloat(form.amount), 
      date: form.date, 
      vendor: form.vendor || null, 
      vehicleId: form.vehicleId || null 
    };
    
    if (editingId) { 
      updateExpense(editingId, data); 
    } else { 
      addExpense(data); 
    }
    resetForm();
  };

  const startEdit = (e: any) => {
    setForm({ 
      category: e.category, 
      description: e.description, 
      amount: e.amount.toString(), 
      date: e.date.slice(0, 10), // Ensure format is correct for input type="date"
      vendor: e.vendor ?? "", 
      vehicleId: e.vehicleId ?? "" 
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  // Do not render anything until client has mounted to prevent Hydration errors
  if (!mounted) return null;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Charges & Dépenses</h1>
          <p className="text-slate-500 text-sm mt-0.5">{expenses.length} entrées · {totalAll.toLocaleString("fr-FR")} MAD total</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange-600 hover:bg-brand-orange-500 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus size={15} /> Ajouter dépense
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(CAT).map(([key, cfg]) => {
          const catTotal = expenses.filter(e => e.category === key).reduce((s, e) => s + Number(e.amount || 0), 0);
          return (
            <button key={key} onClick={() => setFilterCat(filterCat === key ? "ALL" : key)}
              className={cn("rounded-xl border bg-[#161b22] p-3 text-left transition-all", filterCat === key ? "border-brand-orange-500/40 bg-brand-orange-500/5" : "border-[#21262d] hover:border-[#30363d]")}>
              <div className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border mb-2", cfg.color)}>
                {cfg.icon}{cfg.label}
              </div>
              <p className="text-sm font-bold text-white">{catTotal.toLocaleString("fr-FR")} MAD</p>
            </button>
          );
        })}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="rounded-xl border border-brand-orange-500/25 bg-[#161b22] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-200">{editingId ? "Modifier la dépense" : "Nouvelle dépense"}</p>
            <button onClick={resetForm} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Catégorie</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50">
                {Object.entries(CAT).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Montant (MAD) <span className="text-red-400">*</span></label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Date <span className="text-red-400">*</span></label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50" />
            </div>
            <div className="lg:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Description <span className="text-red-400">*</span></label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Vidange + filtres Peugeot 208"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-orange-500/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Fournisseur</label>
              <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Garage, assureur..."
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-orange-500/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Véhicule concerné</label>
              <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-orange-500/50">
                <option value="">Flotte générale</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={!form.description || !form.amount || !form.date}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange-600 hover:bg-brand-orange-500 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors text-sm">
            <Save size={14} /> {editingId ? "Mettre à jour" : "Enregistrer"}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une dépense..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-orange-500/50 transition-all" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#21262d] flex items-center justify-between">
          <p className="text-xs text-slate-500">{filtered.length} entrée{filtered.length > 1 ? "s" : ""}</p>
          <p className="text-sm font-bold text-brand-orange-400">{total.toLocaleString("fr-FR")} MAD</p>
        </div>
        
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-600"><p>Aucune dépense trouvée</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#21262d]">
                {["Catégorie", "Description", "Montant", "Date", "Véhicule", "Fournisseur", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((e) => {
                  const cfg = CAT[e.category] || CAT.OTHER;
                  const veh = vehicles.find((v) => v.id === e.vehicleId);
                  return (
                    <tr key={e.id} className="border-b border-[#21262d] hover:bg-[#1c2130]/50 transition-colors">
                      <td className="px-4 py-3"><span className={cn("inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border", cfg.color)}>{cfg.icon}{cfg.label}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate" title={e.description}>{e.description}</td>
                      <td className="px-4 py-3 text-sm font-bold text-brand-orange-400">− {Number(e.amount).toLocaleString("fr-FR")} MAD</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3"><span className="text-xs font-mono text-slate-500">{veh ? `${veh.plate}` : "—"}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{e.vendor ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(e)} className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-brand-green-400 hover:bg-brand-green-500/10 transition-colors"><Edit2 size={12} /></button>
                          <button onClick={() => deleteExpense(e.id)} className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}