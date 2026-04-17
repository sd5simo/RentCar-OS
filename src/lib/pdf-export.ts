import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js'; 

export async function generateAndUploadPDF({
  elementId,
  fileName,
  bucketName = 'documents' // Nom du bucket Supabase
}: {
  elementId: string;
  fileName: string;
  bucketName?: string;
}) {
  try {
    // 1. Déplacer l'initialisation de Supabase ICI, à l'intérieur de la fonction !
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      alert("Erreur: Les clés Supabase sont introuvables. Vérifiez vos variables d'environnement.");
      return { success: false, error: "Clés manquantes" };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const element = document.getElementById(elementId);
    if (!element) throw new Error("Élément introuvable");

    // 2. Capturer le DOM en image (scale: 2 pour une bonne qualité)
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    // 3. Créer le PDF (format A4)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const pdfBlob = pdf.output('blob');

    // 4. Uploader vers Supabase Storage
    const filePath = `rentals/${fileName}-${Date.now()}.pdf`;
    
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    // Récupérer l'URL publique
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    
    return { success: true, url: publicUrlData.publicUrl, path: filePath };

  } catch (error) {
    console.error("Erreur lors de la génération/upload du PDF :", error);
    return { success: false, error };
  }
}