"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Car, User, Calendar, Fuel, Gauge, Banknote, FileText, CheckCircle, Clock, Printer, X, Edit2, Save, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { rentals, clients, vehicles, updateRental, closeRental } = useStore();
  
  const r = rentals.find((x) => x.id === id);
  const client = clients.find((c) => c.id === r?.clientId);
  const vehicle = vehicles.find((v) => v.id === r?.vehicleId);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState({ mileageEnd: "", fuelEnd: "Plein", returnDate: new Date().toISOString().slice(0, 10) });
  const [isClosing, setIsClosing] = useState(false); // État de chargement
  
  const [editingPayment, setEditingPayment] = useState(false);
  const [paidAmount, setPaidAmount] = useState(r?.paidAmount.toString() ?? "");
  const [newExtra, setNewExtra] = useState({ label: "", amount: "" });
  const [showExtraForm, setShowExtraForm] = useState(false);

  if (!r) return <div className="text-center py-20 text-slate-500"><p>Location introuvable</p><button onClick={() => router.back()} className="mt-3 text-brand-green-400 text-sm hover:underline">← Retour</button></div>;

  const isActive = r.status === "ACTIVE";
  const extrasTotal = r?.extras?.reduce((s, e) => s + e.amount, 0) || 0;
  const grandTotal = r.totalAmount + extrasTotal;
  const remaining = grandTotal - r.paidAmount;

  // 🚨 LA NOUVELLE FONCTION MAGIQUE QUI COMMUNIQUE AVEC LA BASE DE DONNÉES
  const handleClose = async () => {
    setIsClosing(true);
    try {
      const res = await fetch(`/api/rentals/${id}`, {
        method: "POST", // Utilise POST pour Netlify
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          mileageEnd: parseInt(closeForm.mileageEnd) || r.mileageStart,
          fuelLevelEnd: closeForm.fuelEnd,
          returnDate: closeForm.returnDate,
          vehicleId: r.vehicleId // Très important pour libérer la voiture
        })
      });

      if (res.ok) {
        // Met à jour l'interface instantanément
        closeRental(id as string, parseInt(closeForm.mileageEnd) || r.mileageStart, closeForm.fuelEnd, closeForm.returnDate);
        setShowCloseModal(false);
        router.refresh();
      } else {
        alert("Erreur lors de la clôture en base de données.");
      }
    } catch (err) {
      alert("Erreur réseau");
    } finally {
      setIsClosing(false);
    }
  };

  const handleSavePayment = async () => { 
    try {
      await fetch(`/api/rentals/${id}`, { method: "POST", body: JSON.stringify({ paidAmount: parseFloat(paidAmount) || 0 }) });
      updateRental(id as string, { paidAmount: parseFloat(paidAmount) || 0 }); 
      setEditingPayment(false); 
    } catch(e) {}
  };

  const handleAddExtra = async () => {
    if (!newExtra.label || !newExtra.amount) return;
    const newExtras = [...(r.extras || []), { label: newExtra.label, amount: parseFloat(newExtra.amount) }];
    try {
      await fetch(`/api/rentals/${id}`, { method: "POST", body: JSON.stringify({ extras: newExtras }) });
      updateRental(id as string, { extras: newExtras });
      setNewExtra({ label: "", amount: "" });
      setShowExtraForm(false);
    } catch(e) {}
  };

  const handleRemoveExtra = async (idx: number) => {
    const newExtras = r.extras.filter((_, i) => i !== idx);
    try {
      await fetch(`/api/rentals/${id}`, { method: "POST", body: JSON.stringify({ extras: newExtras }) });
      updateRental(id as string, { extras: newExtras });
    } catch(e) {}
  };

  const Row = ({ l, v, hl }: { l: string; v: React.ReactNode; hl?: boolean }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-[#21262d] last:border-0">
      <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{l}</span>
      <span className={cn("text-sm font-semibold", hl ? "text-brand-green-400 text-base font-bold" : "text-slate-200")}>{v}</span>
    </div>
  );

  const formatDateTime = (dateString?: string | Date) => {
    if (!dateString) return { date: "...", time: "..." };
    const d = new Date(dateString);
    return { date: d.toLocaleDateString('fr-FR'), time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
  };
  const start = formatDateTime(r.startDate);
  const end = formatDateTime(r.endDate);
  const printBgStyle = { backgroundColor: '#e5e7eb', WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const };

  return (
    <>
      <style>{`
        @media print {
          body, html { background: white !important; margin: 0; padding: 0; }
          nav, aside, header { display: none !important; }
        }
      `}</style>

      <div className="space-y-5 animate-fade-in print:hidden">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#161b22] mt-1 transition-colors"><ArrowLeft size={16} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-white font-mono">{r.contractNum}</h1>
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border",
                isActive ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20")}>
                {isActive ? <Clock size={11} /> : <CheckCircle size={11} />}{isActive ? "En cours" : "Terminé"}
              </span>
              {remaining > 0 && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-brand-orange-500/15 text-brand-orange-400 border border-brand-orange-500/20"><Banknote size={11} />{remaining.toLocaleString("fr-FR")} MAD dû</span>}
            </div>
            <p className="text-slate-500 text-sm">Créé le {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors">
              <Printer size={14} /> Imprimer
            </button>
            {isActive && <button onClick={() => setShowCloseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-semibold rounded-lg transition-colors"><CheckCircle size={14} /> Clôturer</button>}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-brand-green-500/20 bg-[#161b22] p-4">
            <p className="text-xs text-slate-500">Montant total</p>
            <p className="text-xl font-bold text-brand-green-400 mt-1">{grandTotal.toLocaleString("fr-FR")} MAD</p>
          </div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
            <p className="text-xs text-slate-500">Encaissé</p>
            <p className="text-xl font-bold text-white mt-1">{r.paidAmount.toLocaleString("fr-FR")} MAD</p>
          </div>
          <div className={cn("rounded-xl border bg-[#161b22] p-4", remaining > 0 ? "border-brand-orange-500/25" : "border-[#21262d]")}>
            <p className="text-xs text-slate-500">Solde dû</p>
            <p className={cn("text-xl font-bold mt-1", remaining > 0 ? "text-brand-orange-400" : "text-brand-green-400")}>{remaining.toLocaleString("fr-FR")} MAD</p>
          </div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
            <p className="text-xs text-slate-500">Caution</p>
            <p className="text-xl font-bold text-white mt-1">{r.deposit.toLocaleString("fr-FR")} MAD</p>
            <p className="text-[10px] mt-0.5">{r.depositReturned ? <span className="text-brand-green-400">Rendue</span> : <span className="text-brand-orange-400">En attente</span>}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-2 mb-3 flex items-center gap-2"><Calendar size={14} className="text-brand-green-400" /> Détails du contrat</p>
            <Row l="Date de départ" v={new Date(r.startDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} />
            <Row l="Date de retour prévue" v={new Date(r.endDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} />
            {r.returnDate && <Row l="Retour effectif" v={new Date(r.returnDate).toLocaleDateString("fr-FR")} />}
            <Row l="Durée" v={`${r.totalDays} jour${r.totalDays > 1 ? "s" : ""}`} />
            <Row l="Tarif journalier" v={`${r.dailyRate} MAD/j`} />
            <Row l="Carburant départ" v={r.fuelLevelStart} />
            {r.fuelLevelEnd && <Row l="Carburant retour" v={r.fuelLevelEnd} />}
            <Row l="Kilométrage départ" v={`${r.mileageStart.toLocaleString("fr-FR")} km`} />
            {r.mileageEnd && <>
              <Row l="Kilométrage retour" v={`${r.mileageEnd.toLocaleString("fr-FR")} km`} />
              <Row l="Distance parcourue" v={`${(r.mileageEnd - r.mileageStart).toLocaleString("fr-FR")} km`} />
            </>}
            {r.notes && <Row l="Notes" v={r.notes} />}
          </div>

          <div className="space-y-4">
            {client && (
              <button onClick={() => router.push(`/clients/${client.id}`)}
                className="w-full text-left rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green-600 to-brand-green-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">{client.firstName[0]}{client.lastName[0]}</div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Client</p>
                    <p className="text-sm font-bold text-slate-200">{client.firstName} {client.lastName}</p>
                    <p className="text-xs text-slate-500">{client.phone} · CIN: {client.cin}</p>
                  </div>
                </div>
              </button>
            )}

            {vehicle && (
              <button onClick={() => router.push(`/vehicules/${vehicle.id}`)}
                className="w-full text-left rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1c2130] border border-[#21262d] flex items-center justify-center flex-shrink-0"><Car size={18} className="text-slate-500" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Véhicule</p>
                    <p className="text-sm font-bold text-slate-200">{vehicle.brand} {vehicle.model} {vehicle.year}</p>
                    <p className="text-xs text-slate-500 font-mono">{vehicle.plate} · {vehicle.dailyRate} MAD/j</p>
                  </div>
                </div>
              </button>
            )}

            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-200 flex items-center gap-2"><Banknote size={14} className="text-brand-green-400" /> Paiement</p>
                {!editingPayment ? (
                  <button onClick={() => setEditingPayment(true)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"><Edit2 size={11} /> Modifier</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSavePayment} className="text-xs px-2 py-1 rounded bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20">Sauver</button>
                    <button onClick={() => { setEditingPayment(false); setPaidAmount(r.paidAmount.toString()); }} className="text-xs px-2 py-1 rounded bg-[#1c2130] border border-[#21262d] text-slate-500">Annuler</button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Location ({r.totalDays}j × {r.dailyRate} MAD)</span>
                  <span className="text-slate-200">{r.totalAmount.toLocaleString("fr-FR")} MAD</span>
                </div>
                {r.extras?.map((e, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">+ {e.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200">{e.amount.toLocaleString("fr-FR")} MAD</span>
                      {isActive && <button onClick={() => handleRemoveExtra(i)} className="text-red-400/50 hover:text-red-400"><Trash2 size={11} /></button>}
                    </div>
                  </div>
                ))}
                {isActive && (
                  showExtraForm ? (
                    <div className="flex gap-2 mt-1">
                      <input value={newExtra.label} onChange={(e) => setNewExtra({ ...newExtra, label: e.target.value })} placeholder="Ex: GPS..." className="flex-1 px-2 py-1.5 bg-[#0d1117] border border-[#30363d] rounded text-xs text-slate-200" />
                      <input type="number" value={newExtra.amount} onChange={(e) => setNewExtra({ ...newExtra, amount: e.target.value })} placeholder="MAD" className="w-20 px-2 py-1.5 bg-[#0d1117] border border-[#30363d] rounded text-xs text-slate-200" />
                      <button onClick={handleAddExtra} className="px-2 py-1.5 bg-brand-green-600 text-white rounded text-xs">+</button>
                      <button onClick={() => setShowExtraForm(false)} className="px-2 py-1.5 bg-[#1c2130] text-slate-500 rounded text-xs"><X size={11} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowExtraForm(true)} className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1"><Plus size={10} /> Ajouter un extra</button>
                  )
                )}
                <div className="border-t border-[#21262d] pt-2 flex justify-between font-bold">
                  <span className="text-slate-300">Total</span>
                  <span className="text-white">{grandTotal.toLocaleString("fr-FR")} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Encaissé</span>
                  {editingPayment
                    ? <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-32 px-2 py-1 bg-[#0d1117] border border-brand-green-500/40 rounded text-sm text-brand-green-400 font-bold focus:outline-none text-right" />
                    : <span className="text-brand-green-400 font-bold">{r.paidAmount.toLocaleString("fr-FR")} MAD</span>
                  }
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Caution / Dépôt de garantie</p>
                <p className="text-base font-bold text-white">{r.deposit.toLocaleString("fr-FR")} MAD</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-bold px-2 py-1 rounded-full border", r.depositReturned ? "bg-brand-green-500/10 text-brand-green-400 border-brand-green-500/20" : "bg-brand-orange-500/10 text-brand-orange-400 border-brand-orange-500/20")}>
                  {r.depositReturned ? "✓ Rendue" : "En attente"}
                </span>
                {!r.depositReturned && (
                  <button onClick={async () => {
                    await fetch(`/api/rentals/${id}`, { method: "POST", body: JSON.stringify({ depositReturned: true }) });
                    updateRental(id as string, { depositReturned: true });
                  }} className="text-xs px-3 py-1.5 rounded-lg bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20 hover:bg-brand-green-500/20 transition-colors">Marquer rendue</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black font-sans text-[11px]">
        <div className="w-[210mm] h-[297mm] mx-auto p-[10mm] bg-white">
          <div className="flex justify-between items-center mb-8">
            <div className="w-[120px] h-[60px] border border-gray-400 flex items-center justify-center text-gray-400">[Image 1]</div>
            <div className="text-center"><h1 className="text-[18px] font-extrabold uppercase mb-1">CONTRAT DE LOCATION, N°. {r.contractNum}</h1></div>
            <div className="w-[120px] h-[60px] border border-gray-400 flex items-center justify-center text-gray-400">[Image 2]</div>
          </div>
          <div className="flex border border-black mb-6 w-full leading-snug">
            <div className="w-1/3 border-r border-black flex flex-col">
              <div className="text-center font-bold border-b border-black py-1 uppercase" style={printBgStyle}>LOCATAIRE</div>
              <div className="p-2 space-y-3 flex-grow">
                <p><span className="font-bold">Locataire:</span> {client?.lastName} {client?.firstName}</p>
                <p><span className="font-bold">CIN:</span> {client?.cin}</p>
              </div>
            </div>
            <div className="w-1/3 border-r border-black flex flex-col">
              <div className="text-center font-bold border-b border-black py-1 uppercase" style={printBgStyle}>VEHICULE</div>
              <div className="p-2 space-y-3 flex-grow">
                <p><span className="font-bold">Modèle:</span> {vehicle?.brand} {vehicle?.model}</p>
                <p><span className="font-bold">Plaque:</span> {vehicle?.plate}</p>
              </div>
            </div>
            <div className="w-1/3 flex flex-col">
              <div className="text-center font-bold border-b border-black py-1 uppercase" style={printBgStyle}>LOCATION</div>
              <div className="p-2 space-y-3 flex-grow">
                <p><span className="font-bold">Du:</span> {start.date} <span className="font-bold">Au:</span> {end.date}</p>
                <p><span className="font-bold">Prix:</span> {grandTotal} MAD</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VOTRE MODAL INCHANGÉ VISUELLEMENT MAIS CONNECTÉ À L'API ! */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCloseModal(false)} />
          <div className="relative bg-[#161b22] border border-[#30363d] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-brand-green-400" /> Clôturer la location</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Date de retour</label>
                <input type="date" value={closeForm.returnDate} onChange={(e) => setCloseForm({ ...closeForm, returnDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Kilométrage retour</label>
                <input type="number" value={closeForm.mileageEnd} onChange={(e) => setCloseForm({ ...closeForm, mileageEnd: e.target.value })}
                  placeholder={`≥ ${r.mileageStart.toLocaleString("fr-FR")} km`}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-green-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Niveau carburant retour</label>
                <select value={closeForm.fuelEnd} onChange={(e) => setCloseForm({ ...closeForm, fuelEnd: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200 focus:outline-none">
                  {["Vide", "1/4", "1/2", "3/4", "Plein"].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 py-2.5 bg-[#1c2130] border border-[#30363d] text-slate-400 font-semibold rounded-lg text-sm">Annuler</button>
              <button onClick={handleClose} disabled={isClosing} className="flex-1 py-2.5 bg-brand-green-600 hover:bg-brand-green-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
                {isClosing ? "Clôture en cours..." : "Confirmer la clôture"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}