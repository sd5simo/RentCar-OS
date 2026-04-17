import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
// Adaptez ce chemin vers votre client Supabase existant si nécessaire
import { createClient } from '@supabase/supabase-js'; 

// À remplacer par vos variables d'environnement si elles ne sont pas déjà configurées
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function generateAndUploadPDF({
  elementId,
  fileName,
  bucketName = 'documents' // Nom du bucket Supabase (à créer sur votre dashboard Supabase)
}: {
  elementId: string;
  fileName: string;
  bucketName?: string;
}) {
  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error("Élément introuvable");

    // 1. Capturer le DOM en image (scale: 2 pour une bonne qualité)
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    // 2. Créer le PDF (format A4)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const pdfBlob = pdf.output('blob');

    // 3. Uploader vers Supabase Storage
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