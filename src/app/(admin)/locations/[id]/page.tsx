"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Car, Calendar, Banknote, FileText, CheckCircle, Clock, Printer, X, Edit2, Plus, Trash2, Save, Send, Copy, Users } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import { generateAndUploadPDF } from "@/lib/pdf-export";

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  // 1. Bypass strict de Zustand pour éviter les erreurs de types
  const store = useStore() as any;
  
  // 2. Bypass strict sur la Location pour autoriser les nouveaux champs E-Signature
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
  const [isUploading, setIsUploading] = useState(false);
  const [savedDocUrl, setSavedDocUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Récupération des paramètres (Logo, Cachet, Signatures)
  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => { if (data.settings) setSettings(data.settings); }).catch(() => {});
  }, []);

  if (!r) return <div className="text-center py-20 text-slate-500"><p>Location introuvable</p><button onClick={() => router.back()} className="mt-3 text-brand-green-400">← Retour</button></div>;

  const isActive = r.status === "ACTIVE";
  
  // 3. Sécurisation du calcul des extras
  const extrasList = Array.isArray(r.extras) ? r.extras : [];
  const extrasTotal = extrasList.reduce((sum: number, ext: any) => sum + (Number(ext.amount) || 0), 0);
  const grandTotal = (Number(r.totalAmount) || 0) + extrasTotal;
  const remaining = grandTotal - (Number(r.paidAmount) || 0);

  const handleClose = () => {
    store.closeRental(id as string, parseInt(closeForm.mileageEnd) || 0, closeForm.fuelEnd, closeForm.returnDate);
    setShowCloseModal(false);
  };
  
  const handleSavePayment = () => { store.updateRental(id as string, { paidAmount: parseFloat(paidAmount) || 0 } as any); setEditingPayment(false); };
  
  const handleAddExtra = () => {
    if (!newExtra.label || !newExtra.amount) return;
    store.updateRental(id as string, { extras: [...extrasList, { label: newExtra.label, amount: parseFloat(newExtra.amount) }] } as any);
    setNewExtra({ label: "", amount: "" });
    setShowExtraForm(false);
  };
  
  const handleRemoveExtra = (idx: number) => {
    store.updateRental(id as string, { extras: extrasList.filter((_: any, i: number) => i !== idx) } as any);
  };

  // 4. Fonction de génération sécurisée et ultra-réactive pour l'E-Signature
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
        alert("❌ Erreur API: Impossible de sauvegarder.");
      }
    } catch (error) {
      alert("❌ Erreur réseau.");
    }
    setIsGenerating(false);
  };

  const Row = ({ l, v, hl }: { l: string; v: React.ReactNode; hl?: boolean }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-[#21262d] last:border-0">
      <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{l}</span>
      <span className={cn("text-sm font-semibold", hl ? "text-brand-green-400 text-base font-bold" : "text-slate-200")}>{v}</span>
    </div>
  );

  // Helpers pour le PDF Détaillé
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
      {/* =========================================================================
          PARTIE 1 : INTERFACE NORMALE DU TABLEAU DE BORD (CACHÉE À L'IMPRESSION) 
          ========================================================================= */}
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

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-brand-green-500/20 bg-[#161b22] p-4"><p className="text-xs text-slate-500">Montant total</p><p className="text-xl font-bold text-brand-green-400 mt-1">{grandTotal.toLocaleString("fr-FR")} MAD</p></div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"><p className="text-xs text-slate-500">Encaissé</p><p className="text-xl font-bold text-white mt-1">{Number(r.paidAmount || 0).toLocaleString("fr-FR")} MAD</p></div>
          <div className={cn("rounded-xl border bg-[#161b22] p-4", remaining > 0 ? "border-brand-orange-500/25" : "border-[#21262d]")}><p className="text-xs text-slate-500">Solde dû</p><p className={cn("text-xl font-bold mt-1", remaining > 0 ? "text-brand-orange-400" : "text-brand-green-400")}>{remaining.toLocaleString("fr-FR")} MAD</p></div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"><p className="text-xs text-slate-500">Caution</p><p className="text-xl font-bold text-white mt-1">{Number(r.deposit || 0).toLocaleString("fr-FR")} MAD</p><p className="text-[10px] mt-0.5">{r.depositReturned ? <span className="text-brand-green-400">Rendue</span> : <span className="text-brand-orange-400">En attente</span>}</p></div>
        </div>

        {/* BARRE E-SIGNATURE */}
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

        {/* DETAILS LOCATION & CLIENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-2 mb-3 flex items-center gap-2"><Calendar size={14} className="text-brand-green-400" /> Détails du contrat</p>
            <Row l="Départ" v={start.date} />
            <Row l="Retour" v={end.date} />
            <Row l="Durée" v={`${r.totalDays} jours`} />
            <Row l="Tarif Journalier" v={`${r.dailyRate} MAD/j`} />
            <Row l="Carburant Départ" v={r.fuelLevelStart || "Plein"} />
            <Row l="Kilométrage" v={`${r.mileageStart} km`} />
          </div>

          <div className="space-y-4">
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
                <div className="flex justify-between text-sm"><span className="text-slate-500">Location</span><span className="text-slate-200">{Number(r.totalAmount).toLocaleString("fr-FR")} MAD</span></div>
                
                {extrasList.map((e: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">+ {e.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200">{Number(e.amount).toLocaleString("fr-FR")} MAD</span>
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
                
                <div className="border-t border-[#30363d] mt-2 pt-2 flex justify-between font-bold"><span className="text-slate-400">Total à payer</span><span className="text-white">{grandTotal.toLocaleString("fr-FR")} MAD</span></div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-500 text-sm">Encaissé</span>
                  {editingPayment
                    ? <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-32 px-2 py-1 bg-[#0d1117] border border-brand-green-500/40 rounded text-sm text-brand-green-400 font-bold focus:outline-none text-right" />
                    : <span className="text-brand-green-400 font-bold">{Number(r.paidAmount || 0).toLocaleString("fr-FR")} MAD</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* =========================================================================
          PARTIE 2 : LE CONTRAT PDF COMPLET (DÉTAILLÉ + SIGNATURES INJECTÉES) 
          ========================================================================= */}
      {previewDoc === 'contract' && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 print:bg-white transition-all duration-300">
          
          {/* BARRE D'ACTIONS DU HAUT */}
          <div className="flex items-center justify-between p-4 bg-[#161b22] border-b border-[#30363d] print:hidden shrink-0">
            <h2 className="text-white font-bold text-lg">Prévisualisation Document</h2>
            <div className="flex items-center gap-4">
              {r.signatureStatus === 'SIGNED' ? (
                <span className="flex items-center gap-1 text-green-400 text-xs font-bold px-3 py-1.5 bg-green-400/10 rounded-lg border border-green-400/20"><CheckCircle size={14} /> Client Signé</span>
              ) : r.signatureToken ? (
                <span className="text-[10px] text-brand-orange-400 animate-pulse">En attente du client...</span>
              ) : null}
              
              <button onClick={async () => {
                  setIsUploading(true);
                  const res = await generateAndUploadPDF({ elementId: 'document-to-pdf', fileName: `${r.contractNum}` });
                  setIsUploading(false);
                  if (res.success && 'url' in res) { setSavedDocUrl(res.url as string); alert("✅ Archivé !"); } else alert("❌ Erreur archive.");
                }} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg"><Save size={16} /> Archiver PDF</button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white font-bold rounded"><Printer size={16} /> Imprimer</button>
              <button onClick={() => setPreviewDoc(null)} className="p-2 text-slate-400 hover:text-white hover:bg-[#30363d] rounded-lg transition-colors"><X size={20} /></button>
            </div>
          </div>

          {/* CORPS DU DOCUMENT DÉTAILLÉ */}
          <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
            <div id="document-to-pdf" className="w-[210mm] min-h-[297mm] bg-white text-black font-sans text-[11px] shadow-2xl p-[10mm] print:shadow-none print:w-full print:h-auto">
              
              {/* EN-TÊTE */}
              <div className="flex justify-between items-center mb-8">
                <div className="w-[150px] h-[70px] flex items-center justify-start">
                  {settings?.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" /> : <div className="text-gray-400 border p-2 text-xs">[Logo Agence]</div>}
                </div>
                <div className="text-center">
                  <h1 className="text-[18px] font-extrabold uppercase mb-1">CONTRAT DE LOCATION, N°. {r.contractNum}</h1>
                </div>
                <div className="w-[120px] h-[60px] border border-gray-400 flex items-center justify-center text-gray-400">[QR Code]</div>
              </div>

              {/* LIGNE 1 : LOCATAIRE | VEHICULE | LOCATION */}
              <div className="flex border border-black mb-6 w-full leading-snug">
                <div className="w-1/3 border-r border-black flex flex-col">
                  <div className="text-center font-bold border-b border-black py-1 uppercase" style={printBgStyle}>LOCATAIRE</div>
                  <div className="p-2 space-y-3 flex-grow">
                    <p><span className="font-bold">Locataire:</span> {client?.lastName} {client?.firstName}</p>
                    <p><span className="font-bold">Date de naissance:</span> ___________________</p>
                    <p><span className="font-bold">CIN / Passeport:</span> {client?.cin}</p>
                  </div>
                </div>

                <div className="w-1/3 border-r border-black flex flex-col">
                  <div className="text-center font-bold border-b border-black py-1 uppercase" style={printBgStyle}>VEHICULE</div>
                  <div className="p-2 space-y-3 flex-grow">
                    <p><span className="font-bold">Marque/Modèle:</span> {vehicle?.brand} {vehicle?.model}</p>
                    <p><span className="font-bold">Immatriculation:</span> {vehicle?.plate}</p>
                    <p><span className="font-bold">Options:</span> ___________________</p>
                  </div>
                </div>

                <div className="w-1/3 flex flex-col">
                  <div className="text-center font-bold border-b border-black py-1 uppercase" style={printBgStyle}>LOCATION</div>
                  <div className="p-2 space-y-3 flex-grow">
                    <p><span className="font-bold">Début:</span> {start.date} <span className="font-bold">à</span> {start.time}</p>
                    <p><span className="font-bold">Fin:</span> {end.date} <span className="font-bold">à</span> {end.time}</p>
                    <p><span className="font-bold">Durée:</span> {r.totalDays} Jours</p>
                    <p><span className="font-bold">Prix total:</span> <span className="font-bold text-[13px]">{grandTotal} MAD</span></p>
                    <p><span className="font-bold">Montant de la caution:</span> {r.deposit} MAD</p>
                  </div>
                </div>
              </div>

              {/* LIGNE 2 : TABLEAU DES CONDUCTEURS */}
              <div className="border border-black mb-6">
                <div className="text-center font-bold border-b border-black py-1 uppercase tracking-widest" style={printBgStyle}>CONDUCTEURS</div>
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="border-b border-black font-bold text-[10px]">
                      <td className="py-1 border-r border-black">Nom</td>
                      <td className="py-1 border-r border-black">Prénom</td>
                      <td className="py-1 border-r border-black">Date de naissance</td>
                      <td className="py-1 border-r border-black">N° de permis</td>
                      <td className="py-1">Date d'obtention</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-[11px]">
                      <td className="py-2 border-r border-black uppercase">{client?.lastName}</td>
                      <td className="py-2 border-r border-black capitalize">{client?.firstName}</td>
                      <td className="py-2 border-r border-black text-gray-300">_________________</td>
                      <td className="py-2 border-r border-black uppercase">_________________</td>
                      <td className="py-2 text-gray-300">_________________</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* LIGNE 3 : DEPART / RETOUR + SIGNATURES INJECTÉES */}
              <div className="flex border border-black mb-4 w-full">
                
                {/* DEPART */}
                <div className="w-1/2 border-r border-black flex flex-col">
                  <div className="text-center font-bold border-b border-black py-1 uppercase tracking-widest" style={printBgStyle}>DEPART</div>
                  <div className="p-3 flex flex-col h-[220px]">
                    <div className="flex justify-between mb-2">
                      <p><span className="font-bold">Kms compteur:</span> {r.mileageStart}</p>
                      <p><span className="font-bold">Carburant:</span> {r.fuelLevelStart}</p>
                    </div>
                    <div className="flex-grow border border-gray-300 mb-3 flex items-center justify-center text-gray-300 text-[10px]">[Espace pour croquis voiture]</div>
                    <p className="mb-4"><span className="font-bold">Commentaire:</span> _______________________________</p>
                    
                    <div className="flex justify-between font-bold px-2 relative mt-auto">
                      <div className="w-1/2 relative h-16">
                        <p>Le Client</p>
                        {r.signatureStatus === 'SIGNED' && r.clientSignatureUrl && (
                          <img src={r.clientSignatureUrl} alt="Sign" className="absolute top-4 left-0 h-16 object-contain pointer-events-none" />
                        )}
                      </div>
                      <div className="w-1/2 text-right relative h-16">
                        <p>Le loueur</p>
                        {settings?.stampUrl && <img src={settings.stampUrl} alt="Stamp" className="absolute top-[-10px] right-12 h-24 object-contain opacity-70 mix-blend-multiply pointer-events-none" />}
                        {settings?.signatureUrl && <img src={settings.signatureUrl} alt="Admin Sign" className="absolute top-2 right-0 h-16 object-contain pointer-events-none" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RETOUR */}
                <div className="w-1/2 flex flex-col">
                  <div className="text-center font-bold border-b border-black py-1 uppercase tracking-widest" style={printBgStyle}>RETOUR</div>
                  <div className="p-3 flex flex-col h-[220px]">
                    <div className="flex justify-between mb-2">
                      <p><span className="font-bold">Kms compteur:</span> {r.mileageEnd || "____________"}</p>
                      <p><span className="font-bold">Carburant:</span> {r.fuelLevelEnd || "____________"}</p>
                    </div>
                    <div className="flex-grow border border-gray-300 mb-3 flex items-center justify-center text-gray-300 text-[10px]">[Espace pour croquis voiture]</div>
                    <p className="mb-4"><span className="font-bold">Commentaire:</span> _______________________________</p>
                    
                    <div className="flex justify-between font-bold px-2 relative mt-auto">
                      <div className="w-1/2 relative h-16">
                        <p>Le Client</p>
                        {/* Optionnel: Ajouter signature de retour plus tard */}
                      </div>
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
    </>
  );
}