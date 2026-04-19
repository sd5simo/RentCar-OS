"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User, Car, Banknote, FileText, ArrowRight, Printer, X } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const STATUS_CFG: Record<string, { l: string; c: string }> = {
  CONFIRMED: { l: "Confirmée", c: "text-brand-green-400 bg-brand-green-500/20 border-brand-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]" },
  PENDING:   { l: "En attente", c: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.15)]" },
  CANCELLED: { l: "Annulée", c: "text-red-400 bg-red-500/20 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]" },
  CONVERTED: { l: "Convertie", c: "text-purple-400 bg-purple-500/20 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]" },
};

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { reservations, clients, vehicles, confirmReservation, cancelReservation } = useStore();
  
  const r = reservations.find((x) => x.id === id);
  const client = clients.find((c) => c.id === r?.clientId);
  const vehicle = vehicles.find((v) => v.id === r?.vehicleId);

  const [showPreview, setShowPreview] = useState(false);

  if (!r) return <div className="text-center py-20 text-slate-500"><p className="text-lg">Réservation introuvable</p><button onClick={() => router.back()} className="mt-3 text-brand-green-400 hover:underline">← Retour</button></div>;

  const cfg = STATUS_CFG[r.status];
  const days = Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86400000);

  return (
    <>
      <style>{`
        @media print {
          body, html { background: white !important; margin: 0; padding: 0; }
          nav, aside, header { display: none !important; }
        }
      `}</style>

      <div className={cn("space-y-6 animate-fade-in max-w-4xl mx-auto relative z-10", showPreview && "print:hidden")}>
        <div className="flex flex-col md:flex-row md:items-start gap-4 mb-8">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md shadow-sm flex-shrink-0 mt-1"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl font-black text-white font-mono tracking-tight drop-shadow-md">{r.refCode}</h1>
              <span className={cn("inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm", cfg.c)}>{cfg.l}</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Créée le {new Date(r.createdAt).toLocaleDateString("fr-FR")} à {new Date(r.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex flex-wrap gap-3 md:mt-2">
            <button onClick={() => setShowPreview(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-sm font-bold shadow-sm transition-all backdrop-blur-md">
              <Printer size={16} /> Fiche / Proforma
            </button>
            {r.status === "PENDING" && <>
              <button onClick={() => confirmReservation(id)} className="px-5 py-2.5 rounded-xl bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 hover:bg-brand-green-500/30 text-sm font-bold shadow-sm transition-all">Confirmer</button>
              <button onClick={() => cancelReservation(id)} className="px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm font-bold shadow-sm transition-all">Annuler</button>
            </>}
            {r.status === "CONFIRMED" && (
              <Link href="/locations/nouveau">
                <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all"><ArrowRight size={16} /> Convertir en location</button>
              </Link>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
          <p className="text-sm font-bold text-white border-b border-white/5 pb-4 mb-4 flex items-center gap-2"><div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30"><Calendar size={16} className="text-blue-400" /></div> Détails de la réservation</p>
          {[
            ["Date de début", new Date(r.startDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })],
            ["Date de fin", new Date(r.endDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })],
            ["Durée prévue", `${days} jour${days > 1 ? "s" : ""}`],
            ["Montant total estimé", <span key="amount" className="text-brand-green-400 font-black text-lg drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{r.totalAmount.toLocaleString("fr-FR")} MAD</span>],
          ].map(([l, v]) => (
            <div key={l as string} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
              <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">{l}</span>
              <span className="text-sm font-bold text-white">{v}</span>
            </div>
          ))}
          {r.notes && (
            <div className="pt-3 mt-3 border-t border-white/5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notes spécifiques</p>
              <p className="text-sm text-slate-300 italic bg-black/20 p-3 rounded-xl border border-white/5">{r.notes}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {client && (
            <button onClick={() => router.push(`/clients/${client.id}`)}
              className="w-full text-left glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col items-center text-center gap-3 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green-500 to-brand-green-700 flex items-center justify-center text-xl font-black text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-brand-green-400/30 group-hover:scale-105 transition-transform">{client.firstName[0]}{client.lastName[0]}</div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Profil Client</p>
                <p className="text-lg font-bold text-white group-hover:text-brand-green-400 transition-colors">{client.firstName} {client.lastName}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">{client.phone} <span className="mx-1">•</span> {client.city}</p>
              </div>
            </button>
          )}

          {vehicle && (
            <button onClick={() => router.push(`/vehicules/${vehicle.id}`)}
              className="w-full text-left glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col items-center text-center gap-3 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"><Car size={28} className="text-slate-300" /></div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Véhicule réservé</p>
                <p className="text-lg font-bold text-white group-hover:text-white transition-colors">{vehicle.brand} {vehicle.model} <span className="text-slate-400 font-normal">{vehicle.year}</span></p>
                <p className="text-xs text-slate-400 mt-1 font-medium font-mono">{vehicle.plate} <span className="mx-1 font-sans">•</span> {vehicle.dailyRate} MAD/j</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          PRÉVISUALISATION ET IMPRESSION DE LA FACTURE PROFORMA (RESERVATION)
          ========================================================================= */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 print:bg-white backdrop-blur-md print:backdrop-blur-none transition-all duration-300">
          
          {/* Header Preview Toolbar */}
          <div className="flex items-center justify-between p-4 bg-[#161b22]/80 backdrop-blur-xl border-b border-white/10 print:hidden shrink-0">
            <div>
              <h2 className="text-white font-bold text-lg">Prévisualisation : Fiche de Réservation (Proforma)</h2>
              <p className="text-slate-400 text-xs">Vérifiez les détails avant de confirmer l'impression.</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-brand-green-500/20 border border-brand-green-500/30 text-brand-green-400 font-bold rounded-xl shadow-sm transition-all">
                <Printer size={16} /> Imprimer
              </button>
              <button onClick={() => setShowPreview(false)} className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl border border-transparent hover:border-white/10 transition-all">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
            {/* Contenu Proforma Exact conservé */}
            <div className="w-[210mm] min-h-[297mm] bg-white text-black font-sans text-sm shadow-2xl p-[15mm] print:shadow-none print:w-full print:h-auto relative">
              
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <h1 className="text-9xl font-black rotate-[-45deg] uppercase">PROFORMA</h1>
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h1 className="text-4xl font-black uppercase text-gray-800 tracking-tight">RÉSERVATION</h1>
                    <p className="text-gray-500 mt-2 font-mono font-bold text-lg">Réf: {r.refCode}</p>
                    <p className="text-gray-500 mt-1">Date d'édition: {new Date().toLocaleDateString('fr-FR')}</p>
                    <div className="mt-3 inline-flex px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded-md border border-gray-200">
                      Statut : {STATUS_CFG[r.status]?.l}
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-xl text-gray-800">RentCar OS</h2>
                    <p className="text-gray-600 mt-1">123 Avenue Principale<br/>Casablanca, Maroc</p>
                    <p className="text-gray-600">+212 6 00 00 00 00</p>
                    <p className="text-gray-600">contact@RentCar-os.com</p>
                  </div>
                </div>

                <div className="mb-12 bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2 uppercase text-xs tracking-wider">Informations Client :</h3>
                  <p className="font-bold text-lg">{client?.firstName} {client?.lastName}</p>
                  <p className="text-gray-600 mt-1">CIN / Passeport : {client?.cin}</p>
                  <p className="text-gray-600">{client?.phone} / {client?.city}</p>
                </div>

                <table className="w-full mb-12">
                  <thead>
                    <tr className="border-b-2 border-gray-800 text-left text-sm text-gray-600 uppercase tracking-wide">
                      <th className="py-3 px-2">Détails de la réservation</th>
                      <th className="py-3 px-2 text-center">Durée</th>
                      <th className="py-3 px-2 text-right">Tarif journalier</th>
                      <th className="py-3 px-2 text-right">Montant Estimé</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-2">
                        <p className="font-bold text-gray-800">Réservation Véhicule ({vehicle?.brand} {vehicle?.model})</p>
                        <p className="text-xs text-gray-500 mt-1">Départ prévu : {new Date(r.startDate).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Retour prévu : {new Date(r.endDate).toLocaleDateString('fr-FR')}</p>
                      </td>
                      <td className="py-4 px-2 text-center font-medium">{days} jours</td>
                      <td className="py-4 px-2 text-right font-medium">{vehicle?.dailyRate} MAD</td>
                      <td className="py-4 px-2 text-right font-bold text-gray-800">{r.totalAmount.toLocaleString("fr-FR")} MAD</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-end mb-16">
                  <div className="w-1/2">
                    <div className="flex justify-between py-3 font-black text-xl border-t-2 border-gray-800 mt-2 text-gray-800 bg-gray-50 px-4 rounded-b-lg">
                        <span>Total Estimé TTC:</span>
                        <span>{r.totalAmount.toLocaleString("fr-FR")} MAD</span>
                    </div>
                  </div>
                </div>

                {r.notes && (
                  <div className="mb-12 p-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600">
                    <span className="font-bold uppercase tracking-wider text-xs block mb-1">Notes / Instructions :</span>
                    {r.notes}
                  </div>
                )}

                <div className="mt-20 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
                  <p>Ceci est une facture d'estimation (Proforma). Elle ne constitue pas un reçu de paiement définitif.</p>
                  <p className="mt-1">Document généré automatiquement par RentCar OS le {new Date().toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}