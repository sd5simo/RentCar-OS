"use client";

import { useRef, useState, useEffect } from "react";
import { Eraser, Check, X } from "lucide-react";

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialiser le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurer le style du trait
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
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
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Exporter en PNG avec fond transparent
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm print:hidden">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-[90%] max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117]">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Signature du Client</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center bg-gray-50">
          <p className="text-gray-500 text-xs mb-4 text-center font-medium">Veuillez signer dans le cadre ci-dessous :</p>
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair touch-none shadow-sm"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="p-4 border-t border-[#30363d] flex justify-between gap-3 bg-[#0d1117]">
          <button 
            onClick={clearPad}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1c2130] border border-[#30363d] text-slate-300 text-sm font-semibold hover:bg-[#21262d] transition-colors"
          >
            <Eraser size={16} /> Effacer
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-green-600 text-white text-sm font-bold hover:bg-brand-green-500 shadow-lg shadow-brand-green-500/20 transition-all"
          >
            <Check size={16} /> Valider la signature
          </button>
        </div>
      </div>
    </div>
  );
}