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
  
  // 1. Bypass strict de Zustand pour éviter les erreurs de types
  const { rentals, clients, vehicles, updateRental, closeRental } = useStore() as any;
  
  // 2. Bypass strict sur la Location pour autoriser les nouveaux champs E-Signature
  const rawRental = rentals?.find((x: any) => x.id === id);
  const r = rawRental as any; 
  
  const client = clients?.find((c: any) => c.id === r?.clientId) as any;
  const vehicle = vehicles?.find((v: any) => v.id === r?.vehicleId) as any;

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState({ mileageEnd: "", fuelEnd: "Plein", returnDate: new Date().toISOString().slice(0, 10) });
  const [editingPayment, setEditingPayment] = useState(false);
  const [paidAmount, setPaidAmount] = useState(r?.paidAmount?.toString() ?? "0");
  const [newExtra, setNewExtra] = useState({ label: "", amount: "" });
  const [showExtraForm, setShowExtraForm] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<'contract' | 'invoice' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [savedDocUrl, setSavedDocUrl] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { if (data.settings) setSettings(data.settings); })
      .catch(() => {});
  }, []);

  if (!r) return <div className="text-center py-20 text-slate-500"><p>Location introuvable</p><button onClick={() => router.back()} className="mt-3 text-brand-green-400 text-sm hover:underline">← Retour</button></div>;

  const isActive = r.status === "ACTIVE";
  
  // 3. Sécurisation du calcul des extras (Source fréquente d'erreurs TypeScript)
  const extrasList = Array.isArray(r.extras) ? r.extras : [];
  const extrasTotal = extrasList.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
  const grandTotal = (Number(r.totalAmount) || 0) + extrasTotal;
  const remaining = grandTotal - (Number(r.paidAmount) || 0);

  const handleClose = () => {
    closeRental(id as string, parseInt(closeForm.mileageEnd) || 0, closeForm.fuelEnd, closeForm.returnDate);
    setShowCloseModal(false);
  };
  
  const handleSavePayment = () => { updateRental(id as string, { paidAmount: parseFloat(paidAmount) || 0 } as any); setEditingPayment(false); };
  
  const handleAddExtra = () => {
    if (!newExtra.label || !newExtra.amount) return;
    updateRental(id as string, { extras: [...extrasList, { label: newExtra.label, amount: parseFloat(newExtra.amount) }] } as any);
    setNewExtra({ label: "", amount: "" });
    setShowExtraForm(false);
  };
  
  const handleRemoveExtra = (idx: number) => {
    updateRental(id as string, { extras: extrasList.filter((_: any, i: number) => i !== idx) } as any);
  };

  // 4. Fonction de génération sécurisée et ultra-réactive
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
        // MAJ FORCÉE DIRECTEMENT EN MÉMOIRE (Effet Visuel Instantané)
        r.signatureToken = token;
        r.signaturePin = pin;
        r.signatureStatus = "PENDING";
        
        // MAJ Zustand
        updateRental(id as string, { signatureToken: token, signaturePin: pin, signatureStatus: "PENDING" } as any);
        
        alert("✅ Lien généré et sauvegardé avec succès !");
        router.refresh(); 
      } else {
        alert("❌ Erreur API: " + (data.error || "Impossible de sauvegarder le lien."));
      }
    } catch (error) {
      alert("❌ Erreur réseau. Le serveur ne répond pas.");
    }
    setIsGenerating(false);
  };

  const handleSendEmail = async () => {
    const targetEmail = client?.email || window.prompt("Email du client :");
    if (!targetEmail || !savedDocUrl) return alert("Email ou document manquant.");

    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          clientName: `${client?.firstName} ${client?.lastName}`,
          documentUrl: savedDocUrl,
          documentType: previewDoc === 'contract' ? 'Contrat' : 'Facture',
          refCode: r.contractNum
        })
      });
      const result = await res.json();
      if (result.success) alert("✅ Email envoyé !");
      else alert("❌ Erreur : " + (result.error?.message || "Inconnue"));
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

  const start = r.startDate ? new Date(r.startDate) : new Date();
  const end = r.endDate ? new Date(r.endDate) : new Date();

  return (
    <>
      <div className={cn("space-y-5 animate-fade-in", previewDoc && "print:hidden")}>
        {/* En-tête de page */}
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#161b22] mt-1"><ArrowLeft size={16} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-white font-mono">{r.contractNum}</h1>
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border", isActive ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20")}>
                {isActive ? <Clock size={11} /> : <CheckCircle size={11} />}{isActive ? "En cours" : "Terminé"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => { setPreviewDoc('contract'); setSavedDocUrl(null); }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-slate-200 text-xs font-semibold"><FileText size={14} /> Fiche Location</button>
            <button onClick={() => { setPreviewDoc('invoice'); setSavedDocUrl(null); }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-slate-200 text-xs font-semibold"><Printer size={14} /> Facture</button>
            {isActive && <button onClick={() => setShowCloseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-semibold rounded-lg"><CheckCircle size={14} /> Clôturer</button>}
          </div>
        </div>

        {/* Grille Principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-2 mb-3 flex items-center gap-2"><Calendar size={14} className="text-brand-green-400" /> Détails du contrat</p>
            <Row l="Date de départ" v={start.toLocaleDateString("fr-FR")} />
            <Row l="Date de retour" v={end.toLocaleDateString("fr-FR")} />
            <Row l="Durée" v={`${r.totalDays} jours`} />
            <Row l="Tarif journalier" v={`${r.dailyRate} MAD`} />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-200 flex items-center gap-2"><Banknote size={14} className="text-brand-green-400" /> Paiement</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Location</span><span className="text-slate-200">{r.totalAmount?.toLocaleString("fr-FR")} MAD</span></div>
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
                      <input value={newExtra.label} onChange={(e) => setNewExtra({ ...newExtra, label: e.target.value })} placeholder="Label..." className="flex-1 px-2 py-1.5 bg-[#0d1117] border border-[#30363d] rounded text-xs text-slate-200" />
                      <input type="number" value={newExtra.amount} onChange={(e) => setNewExtra({ ...newExtra, amount: e.target.value })} placeholder="MAD" className="w-20 px-2 py-1.5 bg-[#0d1117] border border-[#30363d] rounded text-xs text-slate-200" />
                      <button onClick={handleAddExtra} className="px-2 py-1.5 bg-brand-green-600 text-white rounded text-xs">+</button>
                      <button onClick={() => setShowExtraForm(false)} className="px-2 py-1.5 bg-[#1c2130] border border-[#21262d] text-slate-500 rounded text-xs"><X size={11} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowExtraForm(true)} className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1"><Plus size={10} /> Ajouter Extra</button>
                  )
                )}
                <div className="border-t border-[#21262d] pt-2 flex justify-between font-bold"><span className="text-slate-300">Total</span><span className="text-white">{grandTotal.toLocaleString("fr-FR")} MAD</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY PDF & E-SIGNATURE */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 print:bg-white transition-all duration-300">
          <div className="flex items-center justify-between p-4 bg-[#161b22] border-b border-[#30363d] print:hidden shrink-0">
            <div>
              <h2 className="text-white font-bold text-lg">Prévisualisation Document</h2>
            </div>
            <div className="flex items-center gap-4">
              
              {/* PANNEAU E-SIGNATURE COMPLETEMENT CORRIGÉ */}
              {previewDoc === 'contract' && (
                <div className="flex items-center gap-3 border-r border-[#30363d] pr-4">
                  {r.signatureStatus === 'SIGNED' ? (
                    <span className="flex items-center gap-1 text-green-400 text-xs font-bold px-3 py-1.5 bg-green-400/10 rounded-lg border border-green-400/20"><CheckCircle size={14} /> Client Signé</span>
                  ) : r.signatureToken ? (
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">PIN: <strong className="text-white text-xs">{r.signaturePin}</strong></span>
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${r.signatureToken}`); alert("✅ Lien copié !"); }} className="flex items-center gap-1 text-[10px] bg-[#1c2130] text-slate-300 px-2 py-1 rounded border border-[#30363d] hover:bg-[#21262d]"><Copy size={10} /> Copier</button>
                      </div>
                      <span className="text-[10px] text-brand-orange-400 animate-pulse">En attente du client...</span>
                    </div>
                  ) : (
                    <button onClick={generateSignatureLink} disabled={isGenerating} className="text-xs bg-brand-green-600 hover:bg-brand-green-500 text-white px-3 py-2 rounded-lg font-bold shadow-lg shadow-brand-green-600/20 transition-all">{isGenerating ? "Création..." : "Générer E-Signature"}</button>
                  )}
                </div>
              )}
              
              <button onClick={async () => {
                  setIsUploading(true);
                  const res = await generateAndUploadPDF({ elementId: 'document-to-pdf', fileName: `${r.contractNum}` });
                  setIsUploading(false);
                  if (res.success && 'url' in res) { setSavedDocUrl(res.url as string); alert("✅ Archivé !"); } else alert("❌ Erreur archive.");
                }} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg"><Save size={16} /> Archiver PDF</button>
              
              <button onClick={() => setPreviewDoc(null)} className="p-2 text-slate-400 hover:text-white hover:bg-[#30363d] rounded-lg transition-colors"><X size={20} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
            {previewDoc === 'contract' && (
              <div id="document-to-pdf" className="w-[210mm] min-h-[297mm] bg-white text-black font-sans text-[11px] shadow-2xl p-[10mm] print:shadow-none print:w-full print:h-auto">
                <div className="flex justify-between items-center mb-8">
                  <div className="w-[150px] h-[70px] flex items-center justify-start">
                    {settings?.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" /> : <div className="w-full h-full border border-gray-400 flex items-center justify-center text-gray-400 text-xs">[Logo Agence]</div>}
                  </div>
                  <div className="text-center"><h1 className="text-[18px] font-extrabold uppercase mb-1">CONTRAT DE LOCATION N° {r.contractNum}</h1></div>
                  <div className="w-[120px] h-[60px] border border-gray-400 flex items-center justify-center text-gray-400">[QR Code]</div>
                </div>

                {/* Le bloc final du contrat avec les signatures */}
                <div className="flex border border-black mb-4 w-full mt-10">
                  <div className="w-1/2 border-r border-black flex flex-col p-3 h-[200px]">
                    <div className="flex justify-between font-bold px-2 relative mt-auto">
                      <div className="w-1/2 relative h-16">
                        <p>Le Client</p>
                        {r.signatureStatus === 'SIGNED' && r.clientSignatureUrl && (
                          <img src={r.clientSignatureUrl} alt="Sign" className="absolute top-4 left-0 h-16 object-contain" />
                        )}
                      </div>
                      <div className="w-1/2 text-right relative h-16">
                        <p>Le loueur</p>
                        {settings?.stampUrl && <img src={settings.stampUrl} alt="Stamp" className="absolute top-[-10px] right-12 h-24 object-contain opacity-70 mix-blend-multiply" />}
                        {settings?.signatureUrl && <img src={settings.signatureUrl} alt="Admin Sign" className="absolute top-2 right-0 h-16 object-contain" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}