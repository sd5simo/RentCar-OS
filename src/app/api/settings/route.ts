import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.agencySettings.findFirst();
    if (!settings) {
      settings = await prisma.agencySettings.create({ data: { securityPin: "1234" } });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    let settings = await prisma.agencySettings.findFirst();

    if (!settings) {
      settings = await prisma.agencySettings.create({ data: { securityPin: "1234" } });
    }

    if (data.newPin && data.newPin.length === 4) {
      if (data.oldPin !== settings.securityPin) {
        return NextResponse.json({ error: "L'ancien PIN est incorrect." }, { status: 403 });
      }
    }

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
    console.error("PUT settings error:", error);
    return NextResponse.json({ error: "Erreur sauvegarde. Image trop lourde ?" }, { status: 500 });
  }
}