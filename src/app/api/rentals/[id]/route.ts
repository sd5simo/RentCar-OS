import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const rental = await prisma.rental.findUnique({
      where: { id: params.id },
      include: { client: true, vehicle: true }
    });
    if (!rental) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(rental);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    const updatedRental = await prisma.rental.update({
      where: { id: params.id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.paidAmount !== undefined && { paidAmount: parseFloat(data.paidAmount) }),
        ...(data.returnDate !== undefined && { returnDate: new Date(data.returnDate) }),
        ...(data.mileageEnd !== undefined && { mileageEnd: parseInt(data.mileageEnd) }),
        ...(data.fuelLevelEnd !== undefined && { fuelLevelEnd: data.fuelLevelEnd }),
        ...(data.depositReturned !== undefined && { depositReturned: data.depositReturned }),
        ...(data.extras !== undefined && { extras: data.extras }),
        
        // CHAMPS E-SIGNATURE
        ...(data.signatureToken !== undefined && { signatureToken: data.signatureToken }),
        ...(data.signaturePin !== undefined && { signaturePin: data.signaturePin }),
        ...(data.signatureStatus !== undefined && { signatureStatus: data.signatureStatus }),
        ...(data.clientSignatureUrl !== undefined && { clientSignatureUrl: data.clientSignatureUrl }),
      }
    });

    return NextResponse.json(updatedRental);
  } catch (error) {
    console.error("Erreur PUT rental:", error);
    return NextResponse.json({ error: "Erreur serveur ou champ manquant" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.rental.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}