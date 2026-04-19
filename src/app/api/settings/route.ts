import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.agencySettings.findFirst();
    if (!settings) {
      settings = await prisma.agencySettings.create({ 
        data: { 
          securityPin: "1234",
          adminUsername: "admin", 
          adminPassword: "rentify" 
        } 
      });
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
      settings = await prisma.agencySettings.create({ 
        data: { 
          securityPin: "1234",
          adminUsername: "admin",
          adminPassword: "rentify"
        } 
      });
    }

    if (data.newPin && data.newPin.length === 4) {
      if (data.oldPin !== settings.securityPin) {
        return NextResponse.json({ error: "L'ancien PIN est incorrect." }, { status: 403 });
      }
    }

    // Préparation sécurisée des données à mettre à jour
    const updateData: any = {};
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.stampUrl !== undefined) updateData.stampUrl = data.stampUrl;
    if (data.signatureUrl !== undefined) updateData.signatureUrl = data.signatureUrl;
    if (data.newPin) updateData.securityPin = data.newPin;
    if (data.adminUsername !== undefined) updateData.adminUsername = data.adminUsername;
    if (data.adminPassword !== undefined) updateData.adminPassword = data.adminPassword;

    const updatedSettings = await prisma.agencySettings.update({
      where: { id: settings.id },
      data: updateData
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error("PUT settings error:", error);
    return NextResponse.json({ error: "Erreur sauvegarde API." }, { status: 500 });
  }
}