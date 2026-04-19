"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Wrench, Shield, Droplets, Package, Search } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const CAT: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  MAINTENANCE: { label: "Maintenance", icon: <Wrench size={12} />,  color: "text-blue-400 bg-blue-500/20 border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]" },
  REPAIR:      { label: "Réparation",  icon: <Wrench size={12} />,  color: "text-red-400 bg-red-500/20 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]" },
  INSURANCE:   { label: "Assurance",   icon: <Shield size={12} />,  color: "text-purple-400 bg-purple-500/20 border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)]" },
  CLEANING:    { label: "Nettoyage",   icon: <Droplets size={12} />,color: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]" },
  FUEL:        { label: "Carburant",   icon: <Droplets size={12} />,color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30 shadow-[0_0_8px_rgba(250,204,21,0.2)]" },
  OTHER:       { label: "Autre",       icon: <Package size={12} />, color: "text-slate-300 bg-slate-500/20 border-slate-500/30 shadow-[0_0_8px_rgba(148,163,184,0.2)]" },
};

export default function ChargesPage() {
  const { expenses = [], vehicles = [], addExpense, updateExpense, deleteExpense } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ category: "MAINTENANCE", description: "", amount: "", date: "", vendor: "", vehicleId: "" });

  const filtered = expenses.filter((e) => {
    const str = `${e.description} ${e.vendor ?? ""}`.toLowerCase();
    return str.includes(search.toLowerCase()) && (filterCat === "ALL" || e.category === filterCat);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalAll = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const resetForm = () => { 
    setForm({ category: "MAINTENANCE", description: "", amount: "", date: new Date().toISOString().slice(0, 10), vendor: "", vehicleId: "" }); 
    setEditingId(null); setShowForm(false); 
  };

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.date) return;
    const data = { category: form.category, description: form.description, amount: parseFloat(form.amount), date: form.date, vendor: form.vendor || null, vehicleId: form.vehicleId || null };
    if (editingId) { updateExpense(editingId, data); } else { addExpense(data); }
    resetForm();
  };

  const startEdit = (e: any) => {
    setForm({ category: e.category, description: e.description, amount: e.amount.toString(), date: e.date.slice(0, 10), vendor: e.vendor ?? "", vehicleId: e.vehicleId ?? "" });
    setEditingId(e.id); setShowForm(true);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Charges & Dépenses</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">{expenses.length} entrées · <span className="text-brand-orange-400 font-bold">{totalAll.toLocaleString("fr-FR")} MAD</span> total</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange-500/20 hover:bg-brand-orange-500/30 border border-brand-orange-500/30 text-brand-orange-400 text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:shadow-[0_0_20px_rgba(249,115,22,0.25)]">
          <Plus size={16} /> Ajouter dépense
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(CAT).map(([key, cfg]) => {
          const catTotal = expenses.filter(e => e.category === key).reduce((s, e) => s + Number(e.amount || 0), 0);
          return (
            <button key={key} onClick={() => setFilterCat(filterCat === key ? "ALL" : key)}
              className={cn("glass-panel glass-panel-hover rounded-2xl p-4 text-left transition-all", filterCat === key ? "border-brand-orange-500/30 bg-brand-orange-500/10 shadow-[0_8px_32px_rgba(249,115,22,0.15)]" : "")}>
              <div className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border shadow-sm mb-3", cfg.color)}>
                {cfg.icon}{cfg.label}
              </div>
              <p className="text-lg font-black text-white truncate">{catTotal.toLocaleString("fr-FR")} MAD</p>
            </button>
          );
        })}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="glass-panel rounded-2xl border-brand-orange-500/30 p-6 space-y-5 shadow-[0_8px_32px_rgba(249,115,22,0.1)]">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-white">{editingId ? "Modifier la dépense" : "Nouvelle dépense"}</p>
            <button onClick={resetForm} className="text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Catégorie</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-orange-500/50 color-scheme-dark">
                {Object.entries(CAT).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Montant (MAD) <span className="text-red-400">*</span></label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00"
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-orange-500/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Date <span className="text-red-400">*</span></label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-orange-500/50 color-scheme-dark" />
            </div>
            <div className="lg:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Description <span className="text-red-400">*</span></label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Vidange + filtres Peugeot 208"
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange-500/50" />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:col-span-1">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Fournisseur</label>
                <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Garage..."
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-orange-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Véhicule</label>
                <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-orange-500/50 color-scheme-dark truncate">
                  <option value="">Flotte</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={!form.description || !form.amount || !form.date}
            className="flex items-center justify-center w-full md:w-auto gap-2 px-6 py-3 bg-brand-orange-500/20 hover:bg-brand-orange-500/30 border border-brand-orange-500/30 text-brand-orange-400 disabled:opacity-40 font-bold rounded-xl transition-all shadow-sm mt-4">
            <Save size={16} /> {editingId ? "Mettre à jour la dépense" : "Enregistrer la dépense"}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une dépense par description ou fournisseur..."
          className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-white/[0.05] focus:border-brand-orange-500/50 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] backdrop-blur-md transition-all" />
      </div>

      {/* Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
          <p className="text-sm font-bold text-slate-300">{filtered.length} entrée{filtered.length > 1 ? "s" : ""}</p>
          <p className="text-base font-black text-brand-orange-400 drop-shadow-sm">{total.toLocaleString("fr-FR")} MAD</p>
        </div>
        
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-medium">Aucune dépense trouvée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5 bg-white/[0.02]">
                {["Catégorie", "Description", "Montant", "Date", "Véhicule", "Fournisseur", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((e) => {
                  const cfg = CAT[e.category] || CAT.OTHER;
                  const veh = vehicles.find((v) => v.id === e.vehicleId);
                  return (
                    <tr key={e.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap"><span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-sm", cfg.color)}>{cfg.icon}{cfg.label}</span></td>
                      <td className="px-6 py-4 text-sm font-medium text-white max-w-[250px] truncate" title={e.description}>{e.description}</td>
                      <td className="px-6 py-4 text-sm font-black text-brand-orange-400 whitespace-nowrap drop-shadow-sm">− {Number(e.amount).toLocaleString("fr-FR")} MAD</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400 whitespace-nowrap">{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                      <td className="px-6 py-4"><span className="text-xs font-bold font-mono text-slate-300 bg-white/5 px-2 py-1 rounded-md border border-white/10">{veh ? `${veh.plate}` : "—"}</span></td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">{e.vendor || <span className="text-slate-600 italic">Non spécifié</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(e)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-brand-green-400 hover:border-brand-green-500/30 hover:bg-brand-green-500/10 transition-all"><Edit2 size={14} /></button>
                          <button onClick={() => deleteExpense(e.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
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