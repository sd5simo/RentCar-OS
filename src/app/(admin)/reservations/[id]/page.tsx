"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User, Car, Banknote, FileText, ArrowRight, Printer, X } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const STATUS_CFG: Record<string, { l: string; c: string }> = {
  CONFIRMED: { l: "Confirmée", c: "text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20" },
  PENDING:   { l: "En attente", c: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  CANCELLED: { l: "Annulée", c: "text-red-400 bg-red-500/10 border-red-500/20" },
  CONVERTED: { l: "Convertie", c: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
};

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { reservations, clients, vehicles, confirmReservation, cancelReservation } = useStore();
  
  const r = reservations.find((x) => x.id === id);
  const client = clients.find((c) => c.id === r?.clientId);
  const vehicle = vehicles.find((v) => v.id === r?.vehicleId);

  const [showPreview, setShowPreview] = useState(false);

  if (!r) return <div className="text-center py-20 text-slate-500"><p>Réservation introuvable</p><button onClick={() => router.back()} className="mt-3 text-brand-green-400 text-sm hover:underline">← Retour</button></div>;

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

      <div className={cn("space-y-5 animate-fade-in max-w-2xl", showPreview && "print:hidden")}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#161b22] transition-colors"><ArrowLeft size={16} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-white font-mono">{r.refCode}</h1><span className={cn("inline-flex text-xs font-bold px-2.5 py-1 rounded-full border", cfg.c)}>{cfg.l}</span></div>
            <p className="text-slate-500 text-sm">Créée le {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-slate-200 hover:border-[#30363d] text-xs font-semibold transition-colors">
              <Printer size={14} /> Fiche / Facture
            </button>
            {r.status === "PENDING" && <>
              <button onClick={() => confirmReservation(id)} className="px-3 py-2 rounded-lg bg-brand-green-600 hover:bg-brand-green-500 text-white text-xs font-semibold">Confirmer</button>
              <button onClick={() => cancelReservation(id)} className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20">Annuler</button>
            </>}
            {r.status === "CONFIRMED" && (
              <Link href="/locations/nouveau">
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-semibold rounded-lg"><ArrowRight size={14} /> Convertir</button>
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5 space-y-3">
          <p className="text-sm font-bold text-slate-200 border-b border-[#21262d] pb-2">Détails</p>
          {[
            ["Date de début", new Date(r.startDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })],
            ["Date de fin", new Date(r.endDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })],
            ["Durée", `${days} jour${days > 1 ? "s" : ""}`],
            ["Montant estimé", `${r.totalAmount.toLocaleString("fr-FR")} MAD`],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between py-2 border-b border-[#21262d] last:border-0">
              <span className="text-xs text-slate-500 uppercase font-semibold">{l}</span>
              <span className="text-sm font-semibold text-slate-200">{v}</span>
            </div>
          ))}
          {r.notes && <p className="text-xs text-slate-500 italic pt-1">{r.notes}</p>}
        </div>

        {client && (
          <button onClick={() => router.push(`/clients/${client.id}`)}
            className="w-full text-left rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green-600 to-brand-green-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">{client.firstName[0]}{client.lastName[0]}</div>
              <div className="flex-1"><p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Client</p><p className="text-sm font-bold text-slate-200">{client.firstName} {client.lastName}</p><p className="text-xs text-slate-500">{client.phone} · {client.city}</p></div>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 group-hover:text-brand-green-400"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </button>
        )}

        {vehicle && (
          <button onClick={() => router.push(`/vehicules/${vehicle.id}`)}
            className="w-full text-left rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-brand-green-500/30 hover:bg-[#1c2130] transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1c2130] border border-[#21262d] flex items-center justify-center flex-shrink-0"><Car size={18} className="text-slate-500" /></div>
              <div className="flex-1"><p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Véhicule</p><p className="text-sm font-bold text-slate-200">{vehicle.brand} {vehicle.model} {vehicle.year}</p><p className="text-xs text-slate-500 font-mono">{vehicle.plate} · {vehicle.dailyRate} MAD/j</p></div>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 group-hover:text-brand-green-400"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </button>
        )}
      </div>

      {/* =========================================================================
          PRÉVISUALISATION ET IMPRESSION DE LA FACTURE PROFORMA (RESERVATION)
          ========================================================================= */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 print:bg-white backdrop-blur-md print:backdrop-blur-none transition-all duration-300">
          
          {/* Header Preview Toolbar (Cachée à l'impression) */}
          <div className="flex items-center justify-between p-4 bg-[#161b22] border-b border-[#30363d] print:hidden shrink-0">
            <div>
              <h2 className="text-white font-bold text-lg">Prévisualisation : Fiche de Réservation (Proforma)</h2>
              <p className="text-slate-400 text-xs">Vérifiez les détails avant de confirmer l'impression.</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-brand-green-500/20 transition-all">
                <Printer size={16} /> Imprimer
              </button>
              <button onClick={() => setShowPreview(false)} className="p-2 text-slate-400 hover:text-white hover:bg-[#30363d] rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Zone d'affichage du document */}
          <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
            
            <div className="w-[210mm] min-h-[297mm] bg-white text-black font-sans text-sm shadow-2xl p-[15mm] print:shadow-none print:w-full print:h-auto relative">
              
              {/* Filigrane pour réservation */}
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
                    <h2 className="font-bold text-xl text-gray-800">Rentify OS</h2>
                    <p className="text-gray-600 mt-1">123 Avenue Principale<br/>Casablanca, Maroc</p>
                    <p className="text-gray-600">+212 6 00 00 00 00</p>
                    <p className="text-gray-600">contact@rentify-os.com</p>
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
                  <p className="mt-1">Document généré automatiquement par Rentify OS le {new Date().toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}