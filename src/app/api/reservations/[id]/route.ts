import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeReservation } from "@/lib/db-helpers";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const r = await prisma.reservation.findUniqueOrThrow({ where: { id: params.id } });
    return NextResponse.json(serializeReservation(r));
  } catch {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data: any = {};
    if (body.status      !== undefined) data.status      = body.status;
    if (body.notes       !== undefined) data.notes       = body.notes;
    if (body.totalAmount !== undefined) data.totalAmount = Number(body.totalAmount);
    if (body.startDate   !== undefined) data.startDate   = new Date(body.startDate);
    if (body.endDate     !== undefined) data.endDate     = new Date(body.endDate);

    const updated = await prisma.reservation.update({ where: { id: params.id }, data });
    return NextResponse.json(serializeReservation(updated));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ajout de "include: { rental: true }" pour que prisma récupère la relation
    const reservation = await prisma.reservation.findUniqueOrThrow({ 
      where: { id: params.id },
      include: { rental: true }
    });

    if (reservation.status === "CONVERTED") {
      return NextResponse.json(
        { error: "Impossible de supprimer une réservation déjà convertie en location." },
        { status: 409 }
      );
    }

    // Retirer le lien de la location si elle existe, puis supprimer la réservation
    if (reservation.rental) {
      await prisma.rental.update({
        where: { id: reservation.rental.id },
        data:  { reservationId: null },
      });
    }
    await prisma.reservation.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/reservations/id]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}