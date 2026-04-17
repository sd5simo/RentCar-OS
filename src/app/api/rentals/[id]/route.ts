import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeRental } from "@/lib/db-helpers";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rental = await prisma.rental.findUniqueOrThrow({ where: { id: params.id } });
    return NextResponse.json(serializeRental(rental));
  } catch {
    return NextResponse.json({ error: "Location introuvable" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const extrasJson = body.extras !== undefined
      ? JSON.stringify(body.extras)
      : undefined;

    // Build update payload — only include defined fields
    const data: any = {};
    if (body.status        !== undefined) data.status        = body.status;
    if (body.paidAmount    !== undefined) data.paidAmount    = Number(body.paidAmount);
    if (body.depositReturned !== undefined) data.depositReturned = Boolean(body.depositReturned);
    if (body.returnDate    !== undefined) data.returnDate    = body.returnDate ? new Date(body.returnDate) : null;
    if (body.mileageEnd    !== undefined) data.mileageEnd    = body.mileageEnd ? Number(body.mileageEnd) : null;
    if (body.fuelLevelEnd  !== undefined) data.fuelLevelEnd  = body.fuelLevelEnd;
    if (body.notes         !== undefined) data.notes         = body.notes;
    if (extrasJson         !== undefined) data.extras        = extrasJson;
    if (body.totalAmount   !== undefined) data.totalAmount   = Number(body.totalAmount);
    if (body.endDate       !== undefined) data.endDate       = new Date(body.endDate);

    const ops: any[] = [prisma.rental.update({ where: { id: params.id }, data })];

    // When closing a rental, set vehicle back to AVAILABLE and update its mileage
    if (body.status === "COMPLETED" && body.vehicleId) {
      ops.push(
        prisma.vehicle.update({
          where: { id: body.vehicleId },
          data: {
            status:  "AVAILABLE",
            mileage: body.mileageEnd ? Number(body.mileageEnd) : undefined,
          },
        })
      );
    }
    // When cancelling
    if (body.status === "CANCELLED" && body.vehicleId) {
      ops.push(
        prisma.vehicle.update({
          where: { id: body.vehicleId },
          data: { status: "AVAILABLE" },
        })
      );
    }

    const [updated] = await prisma.$transaction(ops);
    return NextResponse.json(serializeRental(updated));
  } catch (err: any) {
    console.error("[PUT /api/rentals/id]", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rental = await prisma.rental.findUniqueOrThrow({ where: { id: params.id } });

    if (rental.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Clôturez la location avant de la supprimer." },
        { status: 409 }
      );
    }

    await prisma.rental.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/rentals/id]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
