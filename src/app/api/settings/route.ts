import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.agencySettings.findFirst();
    if (!settings) {
      settings = await prisma.agencySettings.create({ data: { securityPin: "1234", adminUsername: "admin", adminPassword: "rentify" } });
    }
    return NextResponse.json({ settings });
  } catch (error) {
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

    const updatedSettings = await prisma.agencySettings.update({
      where: { id: settings.id },
      data: {
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.stampUrl !== undefined && { stampUrl: data.stampUrl }),
        ...(data.signatureUrl !== undefined && { signatureUrl: data.signatureUrl }),
        ...(data.newPin && { securityPin: data.newPin }),
        ...(data.adminUsername && { adminUsername: data.adminUsername }),
        ...(data.adminPassword && { adminPassword: data.adminPassword }),
      }
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error("Erreur PUT settings:", error);
    return NextResponse.json({ error: "Erreur serveur. L'image est peut-être encore trop lourde." }, { status: 500 });
  }
}