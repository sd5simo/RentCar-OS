"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Eraser, FileText, Lock, ShieldCheck } from "lucide-react";

export default function ClientSignaturePage() {
  const params = useParams();
  const token = params?.token as string;

  const [rental, setRental] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Charger les données du contrat
  useEffect(() => {
    fetch(`/api/public/signature/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRental(data.rental);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Initialiser le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [rental, success]);

  // Logique de dessin pour PC et Mobile
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    canvasRef.current?.getContext("2d")?.closePath();
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async () => {
    if (!pin || pin.length !== 6) {
      alert("Veuillez entrer le code PIN à 6 chiffres.");
      return;
    }
    if (!hasDrawn) {
      alert("Veuillez dessiner votre signature avant de valider.");
      return;
    }

    setIsSubmitting(true);
    const signatureDataUrl = canvasRef.current?.toDataURL("image/png");

    try {
      const res = await fetch(`/api/public/signature/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, signatureDataUrl }),
      });
      const result = await res.json();
      
      if (result.success) {
        setSuccess(true);
      } else {
        alert(result.error || "Une erreur est survenue.");
      }
    } catch (err) {
      alert("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-600"></div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md"><FileText className="mx-auto h-12 w-12 text-red-500 mb-4" /><h1 className="text-xl font-bold text-gray-800 mb-2">Lien Invalide</h1><p className="text-gray-600">{error}</p></div></div>;
  
  if (rental.signatureStatus === "SIGNED" || success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
          <ShieldCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-black text-gray-800 mb-2">Document Signé</h1>
          <p className="text-gray-500 mb-6">Le contrat N° {rental.contractNum} a été signé et validé avec succès. Vous pouvez fermer cette page.</p>
          <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">Rentify OS Secure</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* En-tête du document */}
        <div className="bg-gray-900 p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-green-500/20 mb-3">
            <FileText className="h-6 w-6 text-brand-green-400" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider mb-1">Signature de Contrat</h1>
          <p className="text-gray-400 text-sm">Contrat N° {rental.contractNum}</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Résumé de la location */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-sm">
            <h2 className="font-bold text-gray-800 mb-4 uppercase text-xs tracking-widest border-b pb-2">Récapitulatif</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Locataire</p>
                <p className="font-semibold">{rental.client?.firstName} {rental.client?.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Véhicule</p>
                <p className="font-semibold">{rental.vehicle?.brand} {rental.vehicle?.model}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Départ</p>
                <p className="font-semibold">{new Date(rental.startDate).toLocaleDateString("fr-FR")}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Retour</p>
                <p className="font-semibold">{new Date(rental.endDate).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="col-span-2 mt-2 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-600">Total à payer</span>
                <span className="font-black text-lg text-gray-900">{rental.totalAmount} MAD</span>
              </div>
            </div>
          </div>

          {/* Zone de Signature */}
          <div>
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FileText size={18} /> 1. Dessinez votre signature</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white relative touch-none">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full h-[200px] cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <button onClick={clearPad} className="absolute bottom-3 right-3 flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                <Eraser size={14} /> Recommencer
              </button>
            </div>
          </div>

          {/* Code PIN */}
          <div>
             <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Lock size={18} /> 2. Code de sécurité</h2>
             <p className="text-xs text-gray-500 mb-3">Veuillez entrer le code PIN à 6 chiffres qui vous a été communiqué par l'agence.</p>
             <input 
               type="text" 
               maxLength={6}
               placeholder="123456"
               value={pin}
               onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} // Accepte uniquement les chiffres
               className="w-full text-center text-3xl tracking-[1em] font-mono font-bold py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-brand-green-500 focus:ring-2 focus:ring-brand-green-500/20 transition-all"
             />
          </div>

          {/* Bouton de validation */}
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-4 bg-brand-green-600 hover:bg-brand-green-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-brand-green-600/30 transition-all text-lg"
          >
            {isSubmitting ? (
               <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Traitement...</>
            ) : (
               <><CheckCircle size={24} /> Valider & Signer le Contrat</>
            )}
          </button>

          <p className="text-[10px] text-center text-gray-400 mt-4">
            En signant, vous acceptez les conditions générales de location.
          </p>
        </div>
      </div>
    </div>
  );
}