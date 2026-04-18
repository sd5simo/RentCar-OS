import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.agencySettings.findFirst();
    
    if (!settings) {
      settings = await prisma.agencySettings.create({
        data: { securityPin: "1234" }
      });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Erreur GET settings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    let settings = await prisma.agencySettings.findFirst();

    if (!settings) {
      settings = await prisma.agencySettings.create({
        data: { securityPin: "1234" }
      });
    }

    // Vérifier l'ancien PIN seulement si on essaie d'en définir un nouveau
    if (data.newPin && data.newPin.length === 4) {
      if (data.oldPin !== settings.securityPin) {
        return NextResponse.json({ error: "L'ancien code PIN est incorrect." }, { status: 403 });
      }
    }

    const updatedSettings = await prisma.agencySettings.update({
      where: { id: settings.id },
      data: {
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.stampUrl !== undefined && { stampUrl: data.stampUrl }),
        ...(data.signatureUrl !== undefined && { signatureUrl: data.signatureUrl }),
        ...(data.newPin && { securityPin: data.newPin }),
      }
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error("Erreur PUT settings:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour (l'image est peut-être trop lourde)." }, { status: 500 });
  }
}