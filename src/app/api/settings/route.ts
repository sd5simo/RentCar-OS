import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Récupérer les paramètres actuels
export async function GET() {
  try {
    let settings = await prisma.agencySettings.findFirst();
    
    // Si aucun paramètre n'existe encore, on crée un profil par défaut
    if (!settings) {
      settings = await prisma.agencySettings.create({
        data: { securityPin: "1234" } // Le PIN par défaut
      });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Erreur GET settings:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des paramètres." }, { status: 500 });
  }
}

// Mettre à jour les paramètres
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const settings = await prisma.agencySettings.findFirst();

    if (!settings) {
      return NextResponse.json({ error: "Paramètres introuvables." }, { status: 404 });
    }

    // Vérifier si un changement de PIN est demandé et sécurisé
    if (data.oldPin && data.oldPin !== settings.securityPin) {
      return NextResponse.json({ error: "L'ancien code PIN est incorrect." }, { status: 403 });
    }

    // Mise à jour dans la base de données
    const updatedSettings = await prisma.agencySettings.update({
      where: { id: settings.id },
      data: {
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : settings.logoUrl,
        stampUrl: data.stampUrl !== undefined ? data.stampUrl : settings.stampUrl,
        signatureUrl: data.signatureUrl !== undefined ? data.signatureUrl : settings.signatureUrl,
        securityPin: data.newPin || settings.securityPin,
      }
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error("Erreur PUT settings:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}