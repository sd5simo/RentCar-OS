"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Lock, PenTool, FileText } from "lucide-react";
// IMPORT DE VOTRE PROPRE COMPOSANT LOCAL :
import { SignaturePad } from "@/components/ui/SignaturePad";

export default function SignaturePage() {
  const { token } = useParams<{ token: string }>();
  const [rental, setRental] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  // LE MUR DE SÉCURITÉ
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/public/signature/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) { 
          setError(data.error); 
        } else { 
          setRental(data.rental);
          if (data.rental.signatureStatus === "SIGNED") setIsSubmitted(true);
        }
      })
      .catch(() => setError("Erreur de connexion réseau."))
      .finally(() => setLoading(false));
  }, [token]);

  // VÉRIFICATION DU PIN 6 CHIFFRES
  const handleUnlock = () => {
    if (pinInput === rental?.signaturePin) {
      setIsUnlocked(true);
      setError("");
    } else {
      setError("Code PIN incorrect. Veuillez réessayer.");
      setPinInput("");
    }
  };

  // SAUVEGARDE DE LA SIGNATURE DEPUIS VOTRE COMPOSANT
  const handleSaveSignature = async (signatureDataUrl: string) => {
    setIsSigning(true);
    setShowSignaturePad(false); // On ferme le pop-up

    try {
      const res = await fetch(`/api/public/signature/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: rental.signaturePin, signatureDataUrl })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsSubmitted(true);
      } else { 
        alert(data.error); 
      }
    } catch (err) { 
      alert("Erreur lors de l'envoi de la signature."); 
    }
    setIsSigning(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Chargement sécurisé...</div>;
  
  if (error && !rental) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-red-500 max-w-md w-full">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Lien invalide</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );

  if (isSubmitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border-t-8 border-green-500">
        <CheckCircle size={60} className="text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-black text-gray-800 mb-2">Contrat Signé !</h1>
        <p className="text-gray-500">Merci {rental?.client?.firstName}. Votre signature a bien été transmise à l'agence. Vous pouvez fermer cette page.</p>
      </div>
    </div>
  );

  // 1. L'ÉCRAN BLOQUÉ (LE MUR PIN)
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={30} />
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">Espace Sécurisé</h1>
          <p className="text-sm text-gray-500 mb-8">Veuillez entrer le code PIN à 6 chiffres fourni par l'agence pour lire et signer votre contrat.</p>
          
          <input 
            type="number" 
            maxLength={6}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-4xl tracking-[0.5em] py-4 bg-gray-50 border border-gray-300 text-gray-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 ring-blue-500/20 mb-4 transition-all"
          />
          
          {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}
          
          <button onClick={handleUnlock} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30">
            Accéder au contrat
          </button>
        </div>
      </div>
    );
  }

  // 2. LE CONTRAT ET LE BOUTON DE SIGNATURE (Une fois débloqué)
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans pb-32">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        
        {/* En-tête Contrat */}
        <div className="bg-gray-900 p-6 text-white text-center">
          <FileText size={40} className="mx-auto mb-3 opacity-80" />
          <h1 className="text-2xl font-black uppercase tracking-wide">Contrat de Location</h1>
          <p className="opacity-80 mt-1 font-mono">N° {rental?.contractNum}</p>
        </div>

        {/* Détails du contrat */}
        <div className="p-8 space-y-8">
          <p className="text-gray-600 text-sm text-center">
            Bonjour <strong>{rental?.client?.firstName} {rental?.client?.lastName}</strong>, veuillez relire les conditions de votre location avant de signer.
          </p>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-inner">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Résumé des conditions</p>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Véhicule</span><span className="font-bold text-gray-800">{rental?.vehicle?.brand} {rental?.vehicle?.model}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Immatriculation</span><span className="font-bold font-mono text-gray-800">{rental?.vehicle?.plate}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Date de départ</span><span className="font-bold text-gray-800">{new Date(rental?.startDate).toLocaleDateString('fr-FR')}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Date de retour prévue</span><span className="font-bold text-gray-800">{new Date(rental?.endDate).toLocaleDateString('fr-FR')}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Kilométrage de départ</span><span className="font-bold text-gray-800">{rental?.mileageStart} km</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Caution</span><span className="font-bold text-gray-800">{rental?.deposit} MAD</span></div>
              <div className="flex justify-between pt-2"><span className="text-gray-800 font-bold uppercase">Montant Total TTC</span><span className="font-black text-blue-600 text-xl">{rental?.totalAmount} MAD</span></div>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-justify leading-relaxed">
            <p>En signant ce document, je soussigné(e) <strong>{rental?.client?.firstName} {rental?.client?.lastName}</strong> (CIN: {rental?.client?.cin}), reconnais avoir pris connaissance de l'état du véhicule et accepte sans réserve les conditions générales de location de l'agence.</p>
          </div>
        </div>
      </div>

      {/* Barre d'action fixe en bas pour le client */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex justify-center z-50">
        <button 
          onClick={() => setShowSignaturePad(true)} 
          disabled={isSigning}
          className="w-full max-w-2xl bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex justify-center items-center gap-3 text-lg"
        >
          {isSigning ? "Envoi en cours..." : <><PenTool size={24} /> Cliquer ici pour Signer</>}
        </button>
      </div>

      {/* Affichage de votre composant Modal SignaturePad */}
      {showSignaturePad && (
        <SignaturePad 
          onSave={handleSaveSignature} 
          onCancel={() => setShowSignaturePad(false)} 
        />
      )}
    </div>
  );
}