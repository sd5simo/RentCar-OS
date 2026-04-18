import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

// GET: Récupérer les infos du contrat si le token est valide
export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const rental = await prisma.rental.findUnique({
      where: { signatureToken: params.token },
      include: { client: true, vehicle: true }
    });

    if (!rental) {
      return NextResponse.json({ error: "Lien de signature invalide ou expiré." }, { status: 404 });
    }

    // On ne renvoie que les données nécessaires pour l'affichage public
    return NextResponse.json({ rental });
  } catch (error) {
    console.error("Erreur API GET signature:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Vérifier le PIN et enregistrer la signature
export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const { pin, signatureDataUrl } = await req.json();
    
    const rental = await prisma.rental.findUnique({
      where: { signatureToken: params.token }
    });

    // Erreur corrigée : le "[token]" accidentel a été supprimé ici
    if (!rental) {
      return NextResponse.json({ error: "Contrat introuvable." }, { status: 404 });
    }

    if (rental.signaturePin !== pin) {
      return NextResponse.json({ error: "Code PIN incorrect." }, { status: 403 });
    }

    // Mise à jour de la base de données avec la signature
    await prisma.rental.update({
      where: { signatureToken: params.token },
      data: {
        clientSignatureUrl: signatureDataUrl,
        signatureStatus: "SIGNED"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API POST signature:", error);
    return NextResponse.json({ error: "Erreur lors de la signature." }, { status: 500 });
  }
}