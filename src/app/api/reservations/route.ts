import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeReservation, makeRefCode } from "@/lib/db-helpers";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(reservations.map(serializeReservation));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await prisma.reservation.count();
    const refCode = body.refCode ?? makeRefCode("RES", count);

    const reservation = await prisma.reservation.create({
      data: {
        refCode,
        clientId:    body.clientId,
        vehicleId:   body.vehicleId,
        startDate:   new Date(body.startDate),
        endDate:     new Date(body.endDate),
        totalAmount: Number(body.totalAmount),
        status:      body.status ?? "PENDING",
        notes:       body.notes  ?? null,
      },
    });
    return NextResponse.json(serializeReservation(reservation), { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/reservations]", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
