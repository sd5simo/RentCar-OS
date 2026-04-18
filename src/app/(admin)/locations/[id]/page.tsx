"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Car, Calendar, Banknote, FileText, CheckCircle, Clock, Printer, X, Edit2, Plus, Trash2, Save, Send, Copy } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import { generateAndUploadPDF } from "@/lib/pdf-export";

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { rentals, clients, vehicles, updateRental, closeRental } = useStore();
  
  const r = rentals.find((x) => x.id === id);
  const client = clients.find((c) => c.id === r?.clientId);
  const vehicle = vehicles.find((v) => v.id === r?.vehicleId);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState({ mileageEnd: "", fuelEnd: "Plein", returnDate: new Date().toISOString().slice(0, 10) });
  const [editingPayment, setEditingPayment] = useState(false);
  const [paidAmount, setPaidAmount] = useState(r?.paidAmount.toString() ?? "");
  const [newExtra, setNewExtra] = useState({ label: "", amount: "" });
  const [showExtraForm, setShowExtraForm] = useState(false);

  // États pour l'impression, l'export PDF et l'Email
  const [previewDoc, setPreviewDoc] = useState<'contract' | 'invoice' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [savedDocUrl, setSavedDocUrl] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Génération E-Signature
  const [isGenerating, setIsGenerating] = useState(false);

  // État pour les paramètres de l'agence (Logo, Cachet, Signature)
  const [settings, setSettings] = useState<any>(null);

  // Charger les paramètres au montage
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(err => console.error("Erreur chargement paramètres", err));
  }, []);

  if (!r) return <div className="text-center py-20 text-slate-500"><p>Location introuvable</p><button onClick={() => router.back()} className="mt-3 text-brand-green-400 text-sm hover:underline">← Retour</button></div>;

  const isActive = r.status === "ACTIVE";
  const extrasTotal = r?.extras?.reduce((s, e) => s + e.amount, 0) || 0;
  const grandTotal = r.totalAmount + extrasTotal;
  const remaining = grandTotal - r.paidAmount;

  const handleClose = () => {
    closeRental(id as string, parseInt(closeForm.mileageEnd) || 0, closeForm.fuelEnd, closeForm.returnDate);
    setShowCloseModal(false);
  };
  
  const handleSavePayment = () => { updateRental(id as string, { paidAmount: parseFloat(paidAmount) || 0 }); setEditingPayment(false); };
  
  const handleAddExtra = () => {
    if (!newExtra.label || !newExtra.amount) return;
    updateRental(id as string, { extras: [...(r.extras || []), { label: newExtra.label, amount: parseFloat(newExtra.amount) }] });
    setNewExtra({ label: "", amount: "" });
    setShowExtraForm(false);
  };
  
  const handleRemoveExtra = (idx: number) => updateRental(id as string, { extras: r.extras.filter((_, i) => i !== idx) });

  // Génération du lien de signature électronique
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
      if (res.ok) {
        updateRental(id as string, { signatureToken: token, signaturePin: pin, signatureStatus: "PENDING" } as any);
      } else {
        alert("Erreur serveur lors de la sauvegarde.");
      }
    } catch (error) {
      alert("Erreur réseau lors de la génération du lien.");
    }
    setIsGenerating(false);
  };

  // Envoi Email
  const handleSendEmail = async () => {
    const targetEmail = client?.email || window.prompt("Aucun email trouvé pour ce client. Veuillez le saisir :");
    if (!targetEmail || !savedDocUrl) return alert("Email ou lien du document manquant.");

    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          clientName: `${client?.firstName} ${client?.lastName}`,
          documentUrl: savedDocUrl,
          documentType: previewDoc === 'contract' ? 'Contrat de Location' : 'Facture',
          refCode: r.contractNum
        })
      });
      const result = await res.json();
      if (result.success) alert("Email envoyé avec succès !");
      else alert("Erreur lors de l'envoi : " + (result.error?.message || "Inconnue"));
    } catch (error) {
      alert("Erreur réseau.");
    } finally {
      setIsSendingEmail(false);
    }
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
      {/* PARTIE 1 : INTERFACE DASHBOARD */}
      <div className={cn("space-y-5 animate-fade-in", previewDoc && "print:hidden")}>
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#161b22] mt-1 transition-colors"><ArrowLeft size={16} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-white font-mono">{r.contractNum}</h1>
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border", isActive ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20")}>
                {isActive ? <Clock size={11} /> : <CheckCircle size={11} />}{isActive ? "En cours" : "Terminé"}
              </span>
              {remaining > 0 && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-brand-orange-500/15 text-brand-orange-400 border border-brand-orange-500/20"><Banknote size={11} />{remaining.toLocaleString("fr-FR")} MAD dû</span>}
            </div>
            <p className="text-slate-500 text-sm">Créé le {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => { setPreviewDoc('contract'); setSavedDocUrl(null); }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-slate-200 hover:border-[#30363d] text-xs font-semibold transition-colors"><FileText size={14} /> Fiche Location</button>
            <button onClick={() => { setPreviewDoc('invoice'); setSavedDocUrl(null); }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-slate-200 hover:border-[#30363d] text-xs font-semibold transition-colors"><Printer size={14} /> Facture</button>
            {isActive && <button onClick={() => setShowCloseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-semibold rounded-lg transition-colors"><CheckCircle size={14} /> Clôturer</button>}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-brand-green-500/20 bg-[#161b22] p-4"><p className="text-xs text-slate-500">Montant total</p><p className="text-xl font-bold text-brand-green-400 mt-1">{grandTotal.toLocaleString("fr-FR")} MAD</p></div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"><p className="text-xs text-slate-500">Encaissé</p><p className="text-xl font-bold text-white mt-1">{r.paidAmount.toLocaleString("fr-FR")} MAD</p></div>
          <div className={cn("rounded-xl border bg-[#161b22] p-4", remaining > 0 ? "border-brand-orange-500/25" : "border-[#21262d]")}><p className="text-xs text-slate-500">Solde dû</p><p className={cn("text-xl font-bold mt-1", remaining > 0 ? "text-brand-orange-400" : "text-brand-green-400")}>{remaining.toLocaleString("fr-FR")} MAD</p></div>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"><p className="text-xs text-slate-500">Caution</p><p className="text-xl font-bold text-white mt-1">{r.deposit.toLocaleString("fr-FR")} MAD</p><p className="text-[10px] mt-0.5">{r.depositReturned ? <span className="text-brand-green-400">Rendue</span> : <span className="text-brand-orange-400">En attente</span>}</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-2 mb-3 flex items-center gap-2"><Calendar size={14} className="text-brand-green-400" /> Détails du contrat</p>
            <Row l="Date de départ" v={new Date(r.startDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} />
            <Row l="Date de retour" v={new Date(r.endDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} />
            <Row l="Durée" v={`${r.totalDays} jour${r.totalDays > 1 ? "s" : ""}`} />
            <Row l="Tarif journalier" v={`${r.dailyRate} MAD/j`} />
            <Row l="Carburant départ" v={r.fuelLevelStart} />
            <Row l="Kilométrage départ" v={`${r.mileageStart.toLocaleString("fr-FR")} km`} />
          </div>

          <div className="space-y-4">
            {client && (
              <button onClick={() => router.push(`/clients/${client.id}`)} className="w-full text-left rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green-600 to-brand-green-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">{client.firstName[0]}{client.lastName[0]}</div>
                  <div className="flex-1"><p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Client</p><p className="text-sm font-bold text-slate-200">{client.firstName} {client.lastName}</p><p className="text-xs text-slate-500">{client.phone} · CIN: {client.cin}</p></div>
                </div>
              </button>
            )}

            {vehicle && (
              <button onClick={() => router.push(`/vehicules/${vehicle.id}`)} className="w-full text-left rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1c2130] border border-[#21262d] flex items-center justify-center flex-shrink-0"><Car size={18} className="text-slate-500" /></div>
                  <div className="flex-1"><p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Véhicule</p><p className="text-sm font-bold text-slate-200">{vehicle.brand} {vehicle.model}</p><p className="text-xs text-slate-500 font-mono">{vehicle.plate} · {vehicle.dailyRate} MAD/j</p></div>
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
                <div className="flex justify-between text-sm"><span className="text-slate-500">Location</span><span className="text-slate-200">{r.totalAmount.toLocaleString("fr-FR")} MAD</span></div>
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
                      <button onClick={() => setShowExtraForm(false)} className="px-2 py-1.5 bg-[#1c2130] border border-[#21262d] text-slate-500 rounded text-xs"><X size={11} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowExtraForm(true)} className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1"><Plus size={10} /> Ajouter un extra</button>
                  )
                )}
                <div className="border-t border-[#21262d] pt-2 flex justify-between font-bold"><span className="text-slate-300">Total</span><span className="text-white">{grandTotal.toLocaleString("fr-FR")} MAD</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Encaissé</span>
                  {editingPayment ? <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-32 px-2 py-1 bg-[#0d1117] border border-brand-green-500/40 rounded text-sm text-brand-green-400 font-bold text-right" /> : <span className="text-brand-green-400 font-bold">{r.paidAmount.toLocaleString("fr-FR")} MAD</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PARTIE 2 : PRÉVISUALISATION ET IMPRESSION PDF */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 print:bg-white backdrop-blur-md print:backdrop-blur-none transition-all duration-300">
          
          <div className="flex items-center justify-between p-4 bg-[#161b22] border-b border-[#30363d] print:hidden shrink-0">
            <div>
              <h2 className="text-white font-bold text-lg">Prévisualisation : {previewDoc === 'contract' ? 'Fiche de Location' : 'Facture'}</h2>
              <p className="text-slate-400 text-xs">Vérifiez les détails avant l'impression ou l'envoi.</p>
            </div>
            <div className="flex items-center gap-4">
              
              {/* Options E-Signature */}
              {previewDoc === 'contract' && (
                <div className="flex items-center gap-3 border-r border-[#30363d] pr-4">
                  {(r as any).signatureStatus === 'SIGNED' ? (
                    <span className="flex items-center gap-1 text-green-400 text-xs font-bold px-3 py-1.5 bg-green-400/10 rounded-lg border border-green-400/20"><CheckCircle size={14} /> Client Signé</span>
                  ) : (r as any).signatureToken ? (
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">PIN: <strong className="text-white text-xs">{(r as any).signaturePin}</strong></span>
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${(r as any).signatureToken}`); alert("Lien copié !"); }} className="flex items-center gap-1 text-[10px] bg-[#1c2130] hover:bg-[#21262d] text-slate-300 px-2 py-1 rounded border border-[#30363d] transition-colors"><Copy size={10} /> Copier Lien</button>
                      </div>
                      <span className="text-[10px] text-brand-orange-400 animate-pulse">En attente de signature...</span>
                    </div>
                  ) : (
                    <button onClick={generateSignatureLink} disabled={isGenerating} className="text-xs bg-brand-green-600 hover:bg-brand-green-500 text-white px-3 py-2 rounded-lg font-bold shadow-lg shadow-brand-green-600/20 transition-all">{isGenerating ? "Génération..." : "Générer E-Signature"}</button>
                  )}
                </div>
              )}
              
              <button onClick={async () => {
                  setIsUploading(true);
                  const res = await generateAndUploadPDF({ elementId: 'document-to-pdf', fileName: `${previewDoc === 'contract' ? 'Contrat' : 'Facture'}_${r.contractNum}` });
                  setIsUploading(false);
                  if (res.success && 'url' in res) { setSavedDocUrl(res.url as string); alert("Archivé !"); } else alert("Erreur sauvegarde.");
                }} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all"><Save size={16} /> Archiver PDF</button>

              {savedDocUrl && <button onClick={handleSendEmail} disabled={isSendingEmail} className="flex items-center gap-2 px-4 py-2 bg-brand-orange-500 hover:bg-brand-orange-400 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-brand-orange-500/20"><Send size={16} /> Envoyer</button>}

              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-brand-green-500/20 transition-all"><Printer size={16} /> Imprimer</button>
              <button onClick={() => setPreviewDoc(null)} className="p-2 text-slate-400 hover:text-white hover:bg-[#30363d] rounded-lg transition-colors"><X size={20} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
            
            {/* CONTRAT */}
            {previewDoc === 'contract' && (
              <div id="document-to-pdf" className="w-[210mm] min-h-[297mm] bg-white text-black font-sans text-[11px] shadow-2xl p-[10mm] print:shadow-none print:w-full print:h-auto">
                <div className="flex justify-between items-center mb-8">
                  <div className="w-[150px] h-[70px] flex items-center justify-start">
                    {settings?.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo Agence" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="w-full h-full border border-gray-400 flex items-center justify-center text-gray-400 text-xs">[Logo Agence]</div>
                    )}
                  </div>
                  <div className="text-center">
                    <h1 className="text-[18px] font-extrabold uppercase mb-1">CONTRAT DE LOCATION, N°. {r.contractNum}</h1>
                  </div>
                  <div className="w-[120px] h-[60px] border border-gray-400 flex items-center justify-center text-gray-400">[QR Code]</div>
                </div>

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
                      <p><span className="font-bold">Début:</span> {start.date} à {start.time}</p>
                      <p><span className="font-bold">Fin:</span> {end.date} à {end.time}</p>
                      <p><span className="font-bold">Durée:</span> {r.totalDays} Jours</p>
                      <p><span className="font-bold">Prix total:</span> <span className="font-bold text-[13px]">{grandTotal} MAD</span></p>
                      <p><span className="font-bold">Caution:</span> {r.deposit} MAD</p>
                    </div>
                  </div>
                </div>

                <div className="flex border border-black mb-4 w-full">
                  <div className="w-1/2 border-r border-black flex flex-col">
                    <div className="text-center font-bold border-b border-black py-1 uppercase tracking-widest" style={printBgStyle}>DEPART</div>
                    <div className="p-3 flex flex-col h-[200px]">
                      <div className="flex justify-between mb-2"><p><span className="font-bold">Kms compteur:</span> {r.mileageStart}</p><p><span className="font-bold">Carburant:</span> {r.fuelLevelStart}</p></div>
                      <div className="flex-grow border border-gray-300 mb-3 flex items-center justify-center text-gray-300 text-[10px]">[Espace pour croquis voiture]</div>
                      <p className="mb-4"><span className="font-bold">Commentaire:</span> _______________________________</p>
                      <div className="flex justify-between font-bold px-2 relative">
                        <div className="w-1/2 relative h-16">
                          <p>Le Client</p>
                          {(r as any).signatureStatus === 'SIGNED' && (r as any).clientSignatureUrl && (
                            <img src={(r as any).clientSignatureUrl} alt="Signature Client" className="absolute top-4 left-0 h-16 object-contain pointer-events-none" />
                          )}
                        </div>
                        <div className="w-1/2 text-right relative h-16">
                          <p>Le loueur</p>
                          {settings?.stampUrl && <img src={settings.stampUrl} alt="Cachet" className="absolute top-[-10px] right-12 h-24 object-contain opacity-70 mix-blend-multiply pointer-events-none" />}
                          {settings?.signatureUrl && <img src={settings.signatureUrl} alt="Signature Gérant" className="absolute top-2 right-0 h-16 object-contain pointer-events-none" />}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-1/2 flex flex-col">
                    <div className="text-center font-bold border-b border-black py-1 uppercase tracking-widest" style={printBgStyle}>RETOUR</div>
                    <div className="p-3 flex flex-col h-[200px]">
                      <div className="flex justify-between mb-2"><p><span className="font-bold">Kms:</span> {r.mileageEnd || "________"}</p><p><span className="font-bold">Carburant:</span> {r.fuelLevelEnd || "________"}</p></div>
                      <div className="flex-grow border border-gray-300 mb-3 flex items-center justify-center text-gray-300 text-[10px]">[Espace pour croquis]</div>
                      <p className="mb-4"><span className="font-bold">Commentaire:</span> _______________________________</p>
                      <div className="flex justify-between font-bold px-2 relative">
                        <div className="w-1/2 relative h-16">
                           <p>Le Client</p>
                           {/* Ici viendrait la signature de retour plus tard */}
                        </div>
                        <div className="w-1/2 text-right relative h-16">
                          <p>Le loueur</p>
                          {settings?.stampUrl && <img src={settings.stampUrl} alt="Cachet" className="absolute top-[-10px] right-12 h-24 object-contain opacity-70 mix-blend-multiply pointer-events-none" />}
                          {settings?.signatureUrl && <img src={settings.signatureUrl} alt="Signature Gérant" className="absolute top-2 right-0 h-16 object-contain pointer-events-none" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FACTURE */}
            {previewDoc === 'invoice' && (
               <div id="document-to-pdf" className="w-[210mm] min-h-[297mm] bg-white text-black font-sans text-sm shadow-2xl p-[15mm] print:shadow-none print:w-full print:h-auto">
                 <div className="flex justify-between items-start mb-12">
                   <div><h1 className="text-4xl font-black uppercase text-gray-800 tracking-tight">FACTURE</h1><p className="text-gray-500 mt-2 font-mono font-bold text-lg">N° FAC-{r.contractNum}</p></div>
                   <div className="text-right"><h2 className="font-bold text-xl text-gray-800">Rentify OS</h2><p className="text-gray-600 mt-1">contact@rentify-os.com</p></div>
                 </div>
                 {/* ... Le reste du code de la facture reste identique ... */}
               </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Clôture */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCloseModal(false)} />
          <div className="relative bg-[#161b22] border border-[#30363d] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-brand-green-400" /> Clôturer la location</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Date de retour</label><input type="date" value={closeForm.returnDate} onChange={(e) => setCloseForm({ ...closeForm, returnDate: e.target.value })} className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200" /></div>
              <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Kilométrage retour</label><input type="number" value={closeForm.mileageEnd} onChange={(e) => setCloseForm({ ...closeForm, mileageEnd: e.target.value })} className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200" /></div>
              <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Niveau carburant</label><select value={closeForm.fuelEnd} onChange={(e) => setCloseForm({ ...closeForm, fuelEnd: e.target.value })} className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-slate-200">{["Vide", "1/4", "1/2", "3/4", "Plein"].map((f) => <option key={f}>{f}</option>)}</select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 py-2.5 bg-[#1c2130] border border-[#30363d] text-slate-400 rounded-lg text-sm">Annuler</button>
              <button onClick={handleClose} className="flex-1 py-2.5 bg-brand-green-600 text-white rounded-lg text-sm">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}