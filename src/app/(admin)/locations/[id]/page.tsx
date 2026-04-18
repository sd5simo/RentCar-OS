"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Car, Calendar, Banknote, FileText, CheckCircle, Clock, Printer, X, Plus, Trash2, Save, Send, Copy, Users } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import { generateAndUploadPDF } from "@/lib/pdf-export";

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  // BYPASS TYPESCRIPT
  const store = useStore() as any;
  const rawRental = store.rentals?.find((x: any) => x.id === id);
  const r = rawRental || null; 
  
  const client = store.clients?.find((c: any) => c.id === r?.clientId);
  const vehicle = store.vehicles?.find((v: any) => v.id === r?.vehicleId);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState({ mileageEnd: "", fuelEnd: "Plein", returnDate: new Date().toISOString().slice(0, 10) });
  const [newExtra, setNewExtra] = useState({ label: "", amount: "" });
  const [showExtraForm, setShowExtraForm] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<'contract' | 'invoice' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => { if (data.settings) setSettings(data.settings); }).catch(() => {});
  }, []);

  if (!r) return <div className="text-center py-20 text-slate-500"><p>Location introuvable</p><button onClick={() => router.back()} className="mt-3 text-brand-green-400">← Retour</button></div>;

  const isActive = r.status === "ACTIVE";
  
  // CALCULS
  const extrasList = Array.isArray(r.extras) ? r.extras : [];
  const extrasTotal = extrasList.reduce((sum: number, ext: any) => sum + (Number(ext.amount) || 0), 0);
  const grandTotal = (Number(r.totalAmount) || 0) + extrasTotal;
  const remaining = grandTotal - (Number(r.paidAmount) || 0);

  const handleClose = () => {
    store.closeRental(id as string, parseInt(closeForm.mileageEnd) || 0, closeForm.fuelEnd, closeForm.returnDate);
    setShowCloseModal(false);
  };
  
  const handleAddExtra = () => {
    if (!newExtra.label || !newExtra.amount) return;
    store.updateRental(id as string, { extras: [...extrasList, { label: newExtra.label, amount: parseFloat(newExtra.amount) }] } as any);
    setNewExtra({ label: "", amount: "" });
    setShowExtraForm(false);
  };
  
  const handleRemoveExtra = (idx: number) => {
    store.updateRental(id as string, { extras: extrasList.filter((_: any, i: number) => i !== idx) } as any);
  };

  // E-SIGNATURE API
  const generateSignatureLink = async () => {
    setIsGenerating(true);
    const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const pin = Math.floor(100000 + Math.random() * 900000).toString(); 
    
    try {
      const res = await fetch(`/api/rentals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureToken: token, signaturePin: pin, signatureStatus: "PENDING" })
      });
      const data = await res.json();
      
      if (res.ok && !data.error) {
        r.signatureToken = token; r.signaturePin = pin; r.signatureStatus = "PENDING";
        store.updateRental(id as string, { signatureToken: token, signaturePin: pin, signatureStatus: "PENDING" } as any);
        alert("✅ Lien généré avec succès !");
        router.refresh();
      } else {
        alert("❌ Erreur : Impossible de sauvegarder le lien.");
      }
    } catch (error) {
      alert("❌ Erreur réseau.");
    }
    setIsGenerating(false);
  };

  const Row = ({ l, v }: { l: string; v: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-[#21262d] last:border-0">
      <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{l}</span>
      <span className="text-sm font-semibold text-slate-200">{v}</span>
    </div>
  );

  return (
    <>
      <div className={cn("space-y-5 animate-fade-in", previewDoc && "print:hidden")}>
        
        {/* HEADER */}
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-[#161b22]"><ArrowLeft size={16} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-mono">{r.contractNum}</h1>
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border", isActive ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20")}>
                {isActive ? <Clock size={11} /> : <CheckCircle size={11} />}{isActive ? "En cours" : "Terminé"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPreviewDoc('contract')} className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-white rounded-lg text-sm"><FileText size={14} /> Fiche Location</button>
            <button onClick={() => setPreviewDoc('invoice')} className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-white rounded-lg text-sm"><Printer size={14} /> Facture</button>
            {isActive && <button onClick={() => setShowCloseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white text-sm font-semibold rounded-lg"><CheckCircle size={14} /> Clôturer</button>}
          </div>
        </div>

        {/* RESTAURATION DES 4 CARTES KPIs STATISTIQUES */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-brand-green-500/20 bg-[#161b22] p-4"><p className="text-xs text-slate-500">Montant total</p><p className="text-xl font-bold text-brand-green-400 mt-1">{grandTotal} MAD</p></div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"><p className="text-xs text-slate-500">Encaissé</p><p className="text-xl font-bold text-white mt-1">{r.paidAmount || 0} MAD</p></div>
          <div className={cn("rounded-xl border bg-[#161b22] p-4", remaining > 0 ? "border-brand-orange-500/25" : "border-[#21262d]")}><p className="text-xs text-slate-500">Solde dû</p><p className={cn("text-xl font-bold mt-1", remaining > 0 ? "text-brand-orange-400" : "text-brand-green-400")}>{remaining} MAD</p></div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"><p className="text-xs text-slate-500">Caution</p><p className="text-xl font-bold text-white mt-1">{r.deposit || 0} MAD</p><p className="text-[10px] mt-0.5">{r.depositReturned ? <span className="text-brand-green-400">Rendue</span> : <span className="text-brand-orange-400">En attente</span>}</p></div>
        </div>

        {/* LA BARRE E-SIGNATURE (UNIQUEMENT LIEN ET PIN) */}
        {isActive && (
          <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold flex items-center gap-2">Signature Électronique</h3>
              <p className="text-slate-400 text-sm">Faites signer le contrat au client via son smartphone.</p>
            </div>
            
            {r.signatureStatus === 'SIGNED' ? (
              <span className="flex items-center gap-2 text-green-400 font-bold bg-green-400/10 px-4 py-2 rounded-lg border border-green-400/20"><CheckCircle size={16} /> Contrat Signé par le client</span>
            ) : r.signatureToken ? (
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Code PIN Client</p>
                    <p className="text-2xl font-mono font-bold text-brand-green-400 tracking-[0.2em]">{r.signaturePin}</p>
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${r.signatureToken}`); alert("Lien copié dans le presse-papier !"); }} className="flex items-center gap-2 bg-[#1c2130] hover:bg-[#21262d] text-white px-4 py-3 border border-[#30363d] rounded-lg text-sm font-bold transition-all"><Copy size={16} /> Copier le Lien</button>
              </div>
            ) : (
              <button onClick={generateSignatureLink} disabled={isGenerating} className="px-6 py-3 bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold rounded-lg transition-all">{isGenerating ? "Création..." : "Générer le Lien de Signature"}</button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* COLONNE GAUCHE: CONTRAT */}
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-2 mb-3 flex items-center gap-2"><Calendar size={14} className="text-brand-green-400" /> Détails du contrat</p>
            <Row l="Départ" v={new Date(r.startDate).toLocaleDateString()} />
            <Row l="Retour" v={new Date(r.endDate).toLocaleDateString()} />
            <Row l="Durée" v={`${r.totalDays} jours`} />
            <Row l="Tarif Journalier" v={`${r.dailyRate} MAD/j`} />
            <Row l="Carburant Départ" v={r.fuelLevelStart || "Plein"} />
            <Row l="Kilométrage" v={`${r.mileageStart} km`} />
          </div>

          {/* COLONNE DROITE: CLIENT / VEHICULE / PAIEMENT RESTAURÉS */}
          <div className="space-y-4">
            
            {/* CARTE CLIENT */}
            {client && (
              <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 flex items-center gap-4 hover:border-brand-green-500/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-green-600 to-brand-green-800 flex items-center justify-center text-white font-bold text-lg">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Locataire</p>
                  <p className="text-white font-bold text-sm">{client.firstName} {client.lastName}</p>
                  <p className="text-xs text-slate-400">CIN: {client.cin} • {client.phone}</p>
                </div>
              </div>
            )}

            {/* CARTE VEHICULE */}
            {vehicle && (
              <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 flex items-center gap-4 hover:border-brand-green-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#1c2130] border border-[#30363d] flex items-center justify-center text-slate-400"><Car size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Véhicule</p>
                  <p className="text-white font-bold text-sm">{vehicle.brand} {vehicle.model}</p>
                  <p className="text-xs text-slate-400 font-mono">{vehicle.plate}</p>
                </div>
              </div>
            )}

            {/* PAIEMENT ET EXTRAS */}
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-200 flex items-center gap-2"><Banknote size={14} className="text-brand-green-400" /> Paiement</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Location</span><span className="text-slate-200">{r.totalAmount} MAD</span></div>
                
                {extrasList.map((e: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">+ {e.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200">{e.amount} MAD</span>
                      {isActive && <button onClick={() => handleRemoveExtra(i)} className="text-red-400/50 hover:text-red-400"><Trash2 size={11} /></button>}
                    </div>
                  </div>
                ))}
                
                {isActive && (
                  showExtraForm ? (
                    <div className="flex gap-2 mt-1">
                      <input value={newExtra.label} onChange={(e) => setNewExtra({ ...newExtra, label: e.target.value })} placeholder="Ex: Siège auto..." className="flex-1 px-2 py-1.5 bg-[#0d1117] border border-[#30363d] rounded text-xs text-slate-200" />
                      <input type="number" value={newExtra.amount} onChange={(e) => setNewExtra({ ...newExtra, amount: e.target.value })} placeholder="MAD" className="w-20 px-2 py-1.5 bg-[#0d1117] border border-[#30363d] rounded text-xs text-slate-200" />
                      <button onClick={handleAddExtra} className="px-2 py-1.5 bg-brand-green-600 text-white rounded text-xs">+</button>
                      <button onClick={() => setShowExtraForm(false)} className="px-2 py-1.5 bg-[#1c2130] border border-[#21262d] text-slate-500 rounded text-xs"><X size={11} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowExtraForm(true)} className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1"><Plus size={10} /> Ajouter un extra</button>
                  )
                )}
                
                <div className="border-t border-[#30363d] mt-2 pt-2 flex justify-between font-bold"><span className="text-slate-400">Total à payer</span><span className="text-white">{grandTotal} MAD</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY PDF CONTRACT POUR IMPRESSION */}
      {previewDoc === 'contract' && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center overflow-auto p-8 print:p-0">
          <div className="w-full max-w-4xl flex justify-end gap-4 mb-4 print:hidden">
            <button onClick={() => window.print()} className="bg-brand-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><Printer size={16} /> Imprimer</button>
            <button onClick={() => setPreviewDoc(null)} className="bg-slate-700 text-white px-4 py-2 rounded font-bold">Fermer</button>
          </div>
          <div className="w-[210mm] min-h-[297mm] bg-white p-[15mm] text-black shadow-2xl">
            <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
              <div className="w-[150px] h-[70px] flex items-center">
                {settings?.logoUrl ? <img src={settings.logoUrl} className="max-h-full object-contain" /> : <div className="text-gray-400 font-bold border p-2">VOTRE LOGO</div>}
              </div>
              <h1 className="text-xl font-black uppercase text-center flex-1">CONTRAT DE LOCATION<br/><span className="text-sm">N° {r.contractNum}</span></h1>
            </div>
            
            {/* L'espace de signature au bas du document */}
            <div className="mt-32 flex justify-between border-2 border-black">
              <div className="w-1/2 relative h-40 border-r-2 border-black p-2">
                <p className="font-bold uppercase text-sm">Le Locataire</p>
                <p className="text-[10px] text-gray-500">Lu et approuvé</p>
                {r.signatureStatus === 'SIGNED' && r.clientSignatureUrl && <img src={r.clientSignatureUrl} className="absolute bottom-4 left-4 h-24 object-contain" />}
              </div>
              <div className="w-1/2 relative h-40 p-2">
                <p className="font-bold uppercase text-sm">L'Agence (Le Loueur)</p>
                {settings?.stampUrl && <img src={settings.stampUrl} className="absolute top-4 right-16 h-32 mix-blend-multiply opacity-60" />}
                {settings?.signatureUrl && <img src={settings.signatureUrl} className="absolute bottom-4 right-4 h-20" />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}