"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Car, Calendar, Banknote, FileText, CheckCircle, Clock, Printer, X, Edit2, Plus, Trash2, Save, Copy, ChevronRight } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const store = useStore() as any;
  const rawRental = store.rentals?.find((x: any) => x.id === id);
  const r = rawRental || null; 
  
  const client = store.clients?.find((c: any) => c.id === r?.clientId);
  const vehicle = store.vehicles?.find((v: any) => v.id === r?.vehicleId);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState({ mileageEnd: "", fuelEnd: "Plein", returnDate: new Date().toISOString().slice(0, 10) });
  const [editingPayment, setEditingPayment] = useState(false);
  const [paidAmount, setPaidAmount] = useState(r?.paidAmount?.toString() ?? "0");
  const [newExtra, setNewExtra] = useState({ label: "", amount: "" });
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<'contract' | 'invoice' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => { if (data.settings) setSettings(data.settings); }).catch(() => {});
  }, []);

  if (!r) return <div className="text-center py-20 text-slate-500"><p className="text-lg">Location introuvable</p><button onClick={() => router.back()} className="mt-3 text-brand-green-400 hover:underline text-sm">← Retour</button></div>;

  const isActive = r.status === "ACTIVE";
  const extrasList = Array.isArray(r.extras) ? r.extras : [];
  const extrasTotal = extrasList.reduce((sum: number, ext: any) => sum + (Number(ext.amount) || 0), 0);
  const grandTotal = (Number(r.totalAmount) || 0) + extrasTotal;
  const remaining = grandTotal - (Number(r.paidAmount) || 0);

  // ✅ CORRECTION ICI : Remplacement de `closeRental` par une mise à jour directe (100% fonctionnel)
  const handleClose = () => {
    const finalMileage = parseInt(closeForm.mileageEnd) || r.mileageStart || 0;
    
    // 1. Mettre à jour le contrat de location (Clôturé)
    store.updateRental(id as string, { 
      status: "COMPLETED", 
      mileageEnd: finalMileage,
      fuelLevelEnd: closeForm.fuelEnd,
      returnDate: closeForm.returnDate
    } as any);

    // 2. Libérer le véhicule (Disponible) et actualiser son kilométrage
    if (r.vehicleId) {
      store.updateVehicle(r.vehicleId, {
        status: "AVAILABLE",
        mileage: finalMileage
      } as any);
    }
    
    setShowCloseModal(false); 
  };

  const handleSavePayment = () => { store.updateRental(id as string, { paidAmount: parseFloat(paidAmount) || 0 } as any); setEditingPayment(false); };
  const handleAddExtra = () => {
    if (!newExtra.label || !newExtra.amount) return;
    store.updateRental(id as string, { extras: [...extrasList, { label: newExtra.label, amount: parseFloat(newExtra.amount) }] } as any);
    setNewExtra({ label: "", amount: "" }); setShowExtraForm(false);
  };
  const handleRemoveExtra = (idx: number) => { store.updateRental(id as string, { extras: extrasList.filter((_: any, i: number) => i !== idx) } as any); };

  const generateSignatureLink = async () => {
    setIsGenerating(true);
    const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const pin = Math.floor(100000 + Math.random() * 900000).toString(); 
    try {
      const res = await fetch(`/api/rentals/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signatureToken: token, signaturePin: pin, signatureStatus: "PENDING" }) });
      const data = await res.json();
      if (res.ok && !data.error) {
        r.signatureToken = token; r.signaturePin = pin; r.signatureStatus = "PENDING";
        store.updateRental(id as string, { signatureToken: token, signaturePin: pin, signatureStatus: "PENDING" } as any);
        alert("✅ Lien généré avec succès !"); router.refresh();
      } else { alert("❌ Erreur API: Impossible de sauvegarder."); }
    } catch (error) { alert("❌ Erreur réseau."); }
    setIsGenerating(false);
  };

  const Row = ({ l, v }: { l: string; v: React.ReactNode }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0"><span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">{l}</span><span className="text-sm font-bold text-white">{v}</span></div>
  );

  const start = { date: new Date(r.startDate).toLocaleDateString('fr-FR'), time: new Date(r.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
  const end = { date: new Date(r.endDate).toLocaleDateString('fr-FR'), time: new Date(r.endDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
  const printBgStyle = { backgroundColor: '#e5e7eb', WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const };

  return (
    <>
      <div className={cn("space-y-6 animate-fade-in max-w-6xl mx-auto relative z-10", previewDoc && "print:hidden")}>
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 mb-8">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md shadow-sm flex-shrink-0 mt-1"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl font-black text-white font-mono tracking-tight drop-shadow-md">{r.contractNum}</h1>
              <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm", isActive ? "text-blue-400 bg-blue-500/20 border-blue-500/30" : "text-brand-green-400 bg-brand-green-500/20 border-brand-green-500/30")}>
                {isActive ? <Clock size={12} /> : <CheckCircle size={12} />}{isActive ? "En cours" : "Clôturé"}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Créé le {new Date(r.createdAt).toLocaleDateString("fr-FR")} à {new Date(r.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex flex-wrap gap-3 md:mt-2">
            <button onClick={() => setPreviewDoc('contract')} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 hover:bg-brand-green-500/30 rounded-xl text-sm font-bold shadow-sm transition-all"><FileText size={16} /> Contrat</button>
            <button onClick={() => setPreviewDoc('invoice')} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-sm font-bold shadow-sm transition-all backdrop-blur-md"><Printer size={16} /> Facture</button>
            {isActive && <button onClick={() => setShowCloseModal(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-400 text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"><CheckCircle size={16} /> Clôturer</button>}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-5"><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Montant total</p><p className="text-2xl font-black text-white mt-2 drop-shadow-sm">{grandTotal.toLocaleString("fr-FR")} MAD</p></div>
          <div className="glass-panel rounded-2xl p-5 border-brand-green-500/20 bg-brand-green-500/5 shadow-inner"><p className="text-[11px] font-bold text-brand-green-400 uppercase tracking-widest">Encaissé</p><p className="text-2xl font-black text-brand-green-400 mt-2 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{Number(r.paidAmount || 0).toLocaleString("fr-FR")} MAD</p></div>
          <div className={cn("glass-panel rounded-2xl p-5", remaining > 0 ? "border-brand-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]" : "")}><p className={cn("text-[11px] font-bold uppercase tracking-widest", remaining > 0 ? "text-brand-orange-400" : "text-slate-400")}>Solde dû</p><p className={cn("text-2xl font-black mt-2 drop-shadow-sm", remaining > 0 ? "text-brand-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "text-white")}>{remaining.toLocaleString("fr-FR")} MAD</p></div>
          <div className="glass-panel rounded-2xl p-5"><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Caution</p><p className="text-2xl font-black text-white mt-2 drop-shadow-sm">{Number(r.deposit || 0).toLocaleString("fr-FR")} MAD</p><p className="text-[10px] font-bold uppercase tracking-widest mt-1.5">{r.depositReturned ? <span className="text-brand-green-400">Rendue</span> : <span className="text-brand-orange-400">Conservée</span>}</p></div>
        </div>

        {/* DETAILS LOCATION & CLIENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <p className="text-sm font-bold text-white border-b border-white/5 pb-4 mb-4 flex items-center gap-2"><div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30"><Calendar size={16} className="text-blue-400" /></div> Détails opérationnels</p>
            <Row l="Départ" v={start.date} />
            <Row l="Retour Prévu" v={end.date} />
            {r.returnDate && <Row l="Retour Effectif" v={new Date(r.returnDate).toLocaleDateString('fr-FR')} />}
            <Row l="Durée facturée" v={`${r.totalDays} jours`} />
            <Row l="Tarif Journalier" v={`${r.dailyRate} MAD`} />
            <Row l="Carburant Départ" v={r.fuelLevelStart || "Plein"} />
            {r.fuelLevelEnd && <Row l="Carburant Retour" v={r.fuelLevelEnd} />}
            <Row l="Kms Départ" v={`${r.mileageStart} km`} />
            {r.mileageEnd && <Row l="Kms Retour" v={`${r.mileageEnd} km`} />}
          </div>

          <div className="space-y-6">
            {client && (
              <button onClick={() => router.push(`/clients/${client.id}`)} className="w-full text-left glass-panel glass-panel-hover rounded-3xl p-5 sm:p-6 flex items-center gap-5 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green-500 to-brand-green-700 border border-brand-green-400/30 shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center justify-center text-white font-black text-xl flex-shrink-0 group-hover:scale-105 transition-transform">{client.firstName[0]}{client.lastName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Locataire</p>
                  <p className="text-lg font-bold text-white truncate">{client.firstName} {client.lastName}</p>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">CIN: <span className="font-mono text-slate-300">{client.cin}</span> • {client.phone}</p>
                </div>
                <ChevronRight size={20} className="text-slate-600 group-hover:text-brand-green-400 transition-colors" />
              </button>
            )}

            {vehicle && (
              <button onClick={() => router.push(`/vehicules/${vehicle.id}`)} className="w-full text-left glass-panel glass-panel-hover rounded-3xl p-5 sm:p-6 flex items-center gap-5 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform"><Car size={24} className="text-slate-300" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Véhicule assigné</p>
                  <p className="text-lg font-bold text-white truncate">{vehicle.brand} {vehicle.model}</p>
                  <p className="text-xs font-medium text-slate-400 mt-0.5 font-mono">{vehicle.plate}</p>
                </div>
                <ChevronRight size={20} className="text-slate-600 group-hover:text-white transition-colors" />
              </button>
            )}

            <div className="glass-panel rounded-3xl p-6 sm:p-8 border-brand-green-500/20 shadow-[0_10px_30px_rgba(34,197,94,0.05)]">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <p className="text-sm font-bold text-white flex items-center gap-2"><div className="p-1.5 bg-brand-green-500/20 rounded-lg border border-brand-green-500/30"><Banknote size={16} className="text-brand-green-400" /></div> Comptabilité</p>
                {!editingPayment ? (
                  <button onClick={() => setEditingPayment(true)} className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 transition-all"><Edit2 size={12} /> Éditer</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSavePayment} className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-brand-green-500/20 text-brand-green-400 border border-brand-green-500/30 hover:bg-brand-green-500/30 transition-all shadow-sm">Valider</button>
                    <button onClick={() => { setEditingPayment(false); setPaidAmount(r.paidAmount.toString()); }} className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all">X</button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium"><span className="text-slate-400">Forfait Location</span><span className="text-white">{Number(r.totalAmount).toLocaleString("fr-FR")} MAD</span></div>
                {extrasList.map((e: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm font-medium"><span className="text-slate-400">+ {e.label}</span><div className="flex items-center gap-3"><span className="text-white">{Number(e.amount).toLocaleString("fr-FR")} MAD</span>{isActive && <button onClick={() => handleRemoveExtra(i)} className="w-6 h-6 flex items-center justify-center rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 size={12} /></button>}</div></div>
                ))}
                {isActive && (
                  showExtraForm ? (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-white/5">
                      <input value={newExtra.label} onChange={(e) => setNewExtra({ ...newExtra, label: e.target.value })} placeholder="Désignation extra..." className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-brand-green-500/50" />
                      <div className="flex gap-2">
                        <input type="number" value={newExtra.amount} onChange={(e) => setNewExtra({ ...newExtra, amount: e.target.value })} placeholder="MAD" className="w-24 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-brand-green-500/50 text-right" />
                        <button onClick={handleAddExtra} className="px-3 py-2 bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 font-bold rounded-lg hover:bg-brand-green-500/30"><Plus size={14} /></button>
                        <button onClick={() => setShowExtraForm(false)} className="px-3 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg hover:text-white hover:bg-white/10"><X size={14} /></button>
                      </div>
                    </div>
                  ) : <button onClick={() => setShowExtraForm(true)} className="text-[11px] font-bold uppercase tracking-widest text-brand-green-400 hover:text-white transition-colors flex items-center gap-1.5 mt-2 bg-brand-green-500/10 px-2 py-1 rounded w-fit border border-brand-green-500/20"><Plus size={12} /> Ajouter une charge</button>
                )}
                <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-center"><span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Total à payer TTC</span><span className="text-lg font-black text-white">{grandTotal.toLocaleString("fr-FR")} MAD</span></div>
                <div className="flex justify-between items-center mt-2 bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-green-400">Montant Encaissé</span>
                  {editingPayment ? <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-32 px-3 py-1.5 bg-black/60 border border-brand-green-500/40 rounded-lg text-sm text-brand-green-400 font-bold focus:outline-none text-right [color-scheme:dark]" /> : <span className="text-lg font-black text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{Number(r.paidAmount || 0).toLocaleString("fr-FR")} MAD</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clôture Modal - CORRIGÉ */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCloseModal(false)} />
          <div className="relative glass-panel rounded-3xl p-8 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-5 mx-auto text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
               <CheckCircle size={24} />
            </div>
            <h3 className="text-xl font-black text-white mb-2 text-center">Clôturer la location</h3>
            <p className="text-sm font-bold text-slate-400 mb-8 text-center">Contrat {r.contractNum}</p>
            
            <div className="space-y-5 mb-8">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Kilométrage de retour</label>
                <input type="number" value={closeForm.mileageEnd} onChange={e => setCloseForm({...closeForm, mileageEnd: e.target.value})} placeholder={`Actuel: ${r.mileageStart}`}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Carburant au retour</label>
                <select value={closeForm.fuelEnd} onChange={e => setCloseForm({...closeForm, fuelEnd: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all [color-scheme:dark]">
                  {["Vide", "1/4", "1/2", "3/4", "Plein"].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date de restitution</label>
                <input type="date" value={closeForm.returnDate} onChange={e => setCloseForm({...closeForm, returnDate: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all [color-scheme:dark]" />
              </div>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-300 font-bold rounded-xl text-sm hover:bg-white/10 transition-all">Annuler</button>
              {/* Le bouton n'est plus bloqué si mileageEnd est vide ! */}
              <button onClick={handleClose} className="flex-1 py-3 bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-400 font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">Valider</button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY CONTRAT PDF + E-SIGNATURE */}
      {previewDoc === 'contract' && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 print:bg-white transition-all duration-300 backdrop-blur-md print:backdrop-blur-none">
          <div className="flex items-center justify-between p-4 bg-[#161b22]/80 backdrop-blur-xl border-b border-white/10 print:hidden shrink-0">
            <h2 className="text-white font-bold text-lg hidden md:block">Contrat de Location</h2>
            <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-4 py-2 rounded-xl shadow-inner">
              {r.signatureStatus === 'SIGNED' ? (
                <span className="flex items-center gap-2 text-brand-green-400 font-bold"><CheckCircle size={16} /> Signé</span>
              ) : r.signatureToken ? (
                <div className="flex items-center gap-6">
                   <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Code PIN Client</span>
                      <span className="text-lg font-mono font-bold text-brand-green-400 tracking-[0.2em] leading-none">{r.signaturePin}</span>
                   </div>
                   <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${r.signatureToken}`); alert("Lien copié !"); }} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 border border-white/10 rounded-lg text-xs font-bold transition-all"><Copy size={14} /> Copier le Lien</button>
                </div>
              ) : (
                <button onClick={generateSignatureLink} disabled={isGenerating} className="flex items-center gap-2 bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 hover:bg-brand-green-500/30 px-4 py-2 rounded-lg font-bold text-sm transition-all">{isGenerating ? "Création..." : "Demander E-Signature"}</button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all"><Printer size={16} /> Imprimer</button>
              <button onClick={() => setPreviewDoc(null)} className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl border border-white/10 transition-all"><X size={20} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
            <div id="document-to-pdf" className="w-[210mm] min-h-[297mm] bg-white text-black font-sans text-[11px] shadow-2xl p-[10mm] print:shadow-none print:w-full print:h-auto">
              <div className="flex justify-between items-center mb-8">
                <div className="w-[150px] h-[70px] flex items-center justify-start">
                  {settings?.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" /> : <div className="text-gray-400 border p-2 text-xs">[Logo Agence]</div>}
                </div>
                <div className="text-center"><h1 className="text-[18px] font-extrabold uppercase mb-1">CONTRAT DE LOCATION, N°. {r.contractNum}</h1></div>
                <div className="w-[120px] h-[60px] border border-gray-400 flex items-center justify-center text-gray-400">[QR Code]</div>
              </div>

              <div className="flex border border-black mb-6 w-full leading-snug">
                <div className="w-1/3 border-r border-black flex flex-col"><div className="text-center font-bold border-b border-black py-1 uppercase" style={printBgStyle}>LOCATAIRE</div><div className="p-2 space-y-3 flex-grow"><p><span className="font-bold">Locataire:</span> {client?.lastName} {client?.firstName}</p><p><span className="font-bold">Date de naissance:</span> ___________________</p><p><span className="font-bold">CIN / Passeport:</span> {client?.cin}</p></div></div>
                <div className="w-1/3 border-r border-black flex flex-col"><div className="text-center font-bold border-b border-black py-1 uppercase" style={printBgStyle}>VEHICULE</div><div className="p-2 space-y-3 flex-grow"><p><span className="font-bold">Marque/Modèle:</span> {vehicle?.brand} {vehicle?.model}</p><p><span className="font-bold">Immatriculation:</span> {vehicle?.plate}</p><p><span className="font-bold">Options:</span> ___________________</p></div></div>
                <div className="w-1/3 flex flex-col"><div className="text-center font-bold border-b border-black py-1 uppercase" style={printBgStyle}>LOCATION</div><div className="p-2 space-y-3 flex-grow"><p><span className="font-bold">Début:</span> {start.date} <span className="font-bold">à</span> {start.time}</p><p><span className="font-bold">Fin:</span> {end.date} <span className="font-bold">à</span> {end.time}</p><p><span className="font-bold">Durée:</span> {r.totalDays} Jours</p><p><span className="font-bold">Prix total:</span> <span className="font-bold text-[13px]">{grandTotal} MAD</span></p><p><span className="font-bold">Montant de la caution:</span> {r.deposit} MAD</p></div></div>
              </div>

              <div className="border border-black mb-6">
                <div className="text-center font-bold border-b border-black py-1 uppercase tracking-widest" style={printBgStyle}>CONDUCTEURS</div>
                <table className="w-full text-center border-collapse">
                  <thead><tr className="border-b border-black font-bold text-[10px]"><td className="py-1 border-r border-black">Nom</td><td className="py-1 border-r border-black">Prénom</td><td className="py-1 border-r border-black">Date de naissance</td><td className="py-1 border-r border-black">N° de permis</td><td className="py-1">Date d'obtention</td></tr></thead>
                  <tbody><tr className="text-[11px]"><td className="py-2 border-r border-black uppercase">{client?.lastName}</td><td className="py-2 border-r border-black capitalize">{client?.firstName}</td><td className="py-2 border-r border-black text-gray-300">_________________</td><td className="py-2 border-r border-black uppercase">_________________</td><td className="py-2 text-gray-300">_________________</td></tr></tbody>
                </table>
              </div>

              <div className="flex border border-black mb-4 w-full">
                <div className="w-1/2 border-r border-black flex flex-col">
                  <div className="text-center font-bold border-b border-black py-1 uppercase tracking-widest" style={printBgStyle}>DEPART</div>
                  <div className="p-3 flex flex-col h-[220px]">
                    <div className="flex justify-between mb-2"><p><span className="font-bold">Kms compteur:</span> {r.mileageStart}</p><p><span className="font-bold">Carburant:</span> {r.fuelLevelStart}</p></div>
                    <div className="flex-grow border border-gray-300 mb-3 flex items-center justify-center text-gray-300 text-[10px]">[Espace pour croquis voiture]</div>
                    <p className="mb-4"><span className="font-bold">Commentaire:</span> _______________________________</p>
                    <div className="flex justify-between font-bold px-2 relative mt-auto">
                      <div className="w-1/2 relative h-16">
                        <p>Le Client</p>
                        {r.signatureStatus === 'SIGNED' && r.clientSignatureUrl && <img src={r.clientSignatureUrl} alt="Sign" className="absolute top-4 left-0 h-16 object-contain pointer-events-none" />}
                      </div>
                      <div className="w-1/2 text-right relative h-16">
                        <p>Le loueur</p>
                        {settings?.stampUrl && <img src={settings.stampUrl} alt="Stamp" className="absolute top-[-10px] right-12 h-24 object-contain opacity-70 mix-blend-multiply pointer-events-none" />}
                        {settings?.signatureUrl && <img src={settings.signatureUrl} alt="Admin Sign" className="absolute top-2 right-0 h-16 object-contain pointer-events-none" />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-1/2 flex flex-col">
                  <div className="text-center font-bold border-b border-black py-1 uppercase tracking-widest" style={printBgStyle}>RETOUR</div>
                  <div className="p-3 flex flex-col h-[220px]">
                    <div className="flex justify-between mb-2"><p><span className="font-bold">Kms compteur:</span> {r.mileageEnd || "____________"}</p><p><span className="font-bold">Carburant:</span> {r.fuelLevelEnd || "____________"}</p></div>
                    <div className="flex-grow border border-gray-300 mb-3 flex items-center justify-center text-gray-300 text-[10px]">[Espace pour croquis voiture]</div>
                    <p className="mb-4"><span className="font-bold">Commentaire:</span> _______________________________</p>
                    <div className="flex justify-between font-bold px-2 relative mt-auto">
                      <div className="w-1/2 relative h-16"><p>Le Client</p></div>
                      <div className="w-1/2 text-right relative h-16">
                        <p>Le loueur</p>
                        {settings?.stampUrl && <img src={settings.stampUrl} alt="Stamp" className="absolute top-[-10px] right-12 h-24 object-contain opacity-70 mix-blend-multiply pointer-events-none" />}
                        {settings?.signatureUrl && <img src={settings.signatureUrl} alt="Admin Sign" className="absolute top-2 right-0 h-16 object-contain pointer-events-none" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY FACTURE */}
      {previewDoc === 'invoice' && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 print:bg-white backdrop-blur-md print:backdrop-blur-none transition-all duration-300">
          <div className="flex items-center justify-between p-4 bg-[#161b22]/80 backdrop-blur-xl border-b border-white/10 print:hidden shrink-0">
            <h2 className="text-white font-bold text-lg">Prévisualisation Facture</h2>
            <div className="flex items-center gap-4">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 font-bold rounded-xl"><Printer size={16} /> Imprimer</button>
              <button onClick={() => setPreviewDoc(null)} className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl border border-white/10 transition-all"><X size={20} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
            <div id="invoice-to-pdf" className="w-[210mm] min-h-[297mm] bg-white text-black font-sans text-[12px] shadow-2xl p-[15mm] print:shadow-none print:w-full print:h-auto">
              <div className="flex justify-between items-start mb-12">
                <div className="w-[150px] h-[70px] flex items-center justify-start">{settings?.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" /> : <div className="text-gray-400 border p-2 text-xs">[Logo Agence]</div>}</div>
                <div className="text-right"><h1 className="text-4xl font-black uppercase text-gray-800 tracking-tight">FACTURE</h1><p className="text-gray-500 mt-2 font-mono font-bold text-lg">N° FAC-{r.contractNum}</p><p className="text-gray-500 mt-1">Date : {new Date().toLocaleDateString('fr-FR')}</p></div>
              </div>
              <div className="flex justify-between mb-10">
                <div><p className="font-bold text-gray-500 uppercase text-[10px] mb-1">Émetteur</p><p className="font-bold text-base">Votre Agence</p><p className="text-gray-600">Maroc</p></div>
                <div className="text-right"><p className="font-bold text-gray-500 uppercase text-[10px] mb-1">Facturé à</p><p className="font-bold text-base">{client?.firstName} {client?.lastName}</p><p className="text-gray-600">CIN: {client?.cin}</p><p className="text-gray-600">{client?.phone}</p></div>
              </div>
              <table className="w-full mb-8 border-collapse">
                <thead><tr className="border-b-2 border-black text-left"><th className="py-2 font-bold uppercase text-[11px]">Description</th><th className="py-2 font-bold uppercase text-[11px] text-center">Quantité</th><th className="py-2 font-bold uppercase text-[11px] text-right">Prix Unitaire</th><th className="py-2 font-bold uppercase text-[11px] text-right">Total</th></tr></thead>
                <tbody>
                  <tr className="border-b border-gray-200"><td className="py-3"><p className="font-bold">Location - {vehicle?.brand} {vehicle?.model}</p><p className="text-gray-500 text-[10px]">Du {start.date} au {end.date}</p></td><td className="py-3 text-center">{r.totalDays} jours</td><td className="py-3 text-right">{r.dailyRate} MAD</td><td className="py-3 text-right font-bold">{r.totalAmount} MAD</td></tr>
                  {extrasList.map((e: any, i: number) => (<tr key={i} className="border-b border-gray-200"><td className="py-3 font-medium">Extra: {e.label}</td><td className="py-3 text-center">-</td><td className="py-3 text-right">-</td><td className="py-3 text-right font-bold">{e.amount} MAD</td></tr>))}
                </tbody>
              </table>
              <div className="flex justify-end mt-10">
                <div className="w-1/2">
                  <div className="flex justify-between py-2 border-b border-gray-200"><span className="font-bold text-gray-600">Total TTC</span><span className="font-bold text-lg">{grandTotal.toLocaleString("fr-FR")} MAD</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-200"><span className="text-gray-600">Montant payé</span><span className="text-green-600 font-bold">{Number(r.paidAmount || 0).toLocaleString("fr-FR")} MAD</span></div>
                  <div className="flex justify-between py-2 border-b-2 border-black bg-gray-50 p-2 mt-2"><span className="font-bold uppercase">Reste à payer</span><span className="font-black text-xl text-red-600">{remaining.toLocaleString("fr-FR")} MAD</span></div>
                </div>
              </div>
              <div className="mt-20">
                <p className="text-center text-gray-500 text-[10px] mb-8">En cas de question concernant cette facture, veuillez nous contacter.</p>
                <div className="flex justify-end relative h-32">
                  <div className="text-center"><p className="font-bold uppercase text-sm mb-2">Cachet et Signature</p>
                    {settings?.stampUrl && <img src={settings.stampUrl} alt="Stamp" className="absolute top-8 right-16 h-24 mix-blend-multiply opacity-60 pointer-events-none" />}
                    {settings?.signatureUrl && <img src={settings.signatureUrl} alt="Admin Sign" className="absolute top-12 right-0 h-16 pointer-events-none" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}