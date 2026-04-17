import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeRental, makeRefCode } from "@/lib/db-helpers";

export async function GET() {
  try {
    const rentals = await prisma.rental.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(rentals.map(serializeRental));
  } catch (err: any) {
    console.error("[GET /api/rentals]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Generate contract number
    const count = await prisma.rental.count();
    const contractNum = body.contractNum ?? makeRefCode("CTR", count);

    // Extras must be stored as JSON string in Prisma
    const extrasJson = body.extras
      ? JSON.stringify(body.extras)
      : null;

    const [rental] = await prisma.$transaction([
      prisma.rental.create({
        data: {
          contractNum,
          clientId:        body.clientId,
          vehicleId:       body.vehicleId,
          reservationId:   body.reservationId ?? null,
          startDate:       new Date(body.startDate),
          endDate:         new Date(body.endDate),
          returnDate:      body.returnDate ? new Date(body.returnDate) : null,
          dailyRate:       Number(body.dailyRate),
          totalDays:       Number(body.totalDays),
          totalAmount:     Number(body.totalAmount),
          paidAmount:      Number(body.paidAmount ?? 0),
          deposit:         Number(body.deposit ?? 0),
          depositReturned: Boolean(body.depositReturned ?? false),
          fuelLevelStart:  body.fuelLevelStart ?? "Plein",
          fuelLevelEnd:    body.fuelLevelEnd   ?? null,
          mileageStart:    Number(body.mileageStart ?? 0),
          mileageEnd:      body.mileageEnd ? Number(body.mileageEnd) : null,
          status:          body.status ?? "ACTIVE",
          extras:          extrasJson,
          notes:           body.notes ?? null,
        },
      }),
      // Update vehicle status to RENTED
      prisma.vehicle.update({
        where: { id: body.vehicleId },
        data:  { status: "RENTED" },
      }),
    ]);

    return NextResponse.json(serializeRental(rental), { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/rentals]", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
