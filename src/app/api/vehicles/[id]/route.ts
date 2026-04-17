import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeVehicle } from "@/lib/db-helpers";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vehicle = await prisma.vehicle.findUniqueOrThrow({
      where: { id: params.id },
      include: { damageLogs: { orderBy: { reportedAt: "desc" } } },
    });
    return NextResponse.json(serializeVehicle(vehicle));
  } catch {
    return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      include: { damageLogs: true },
      data: {
        plate:                   body.plate,
        brand:                   body.brand,
        model:                   body.model,
        year:                    body.year   !== undefined ? Number(body.year)   : undefined,
        category:                body.category,
        color:                   body.color,
        fuelType:                body.fuelType,
        transmission:            body.transmission,
        seats:                   body.seats  !== undefined ? Number(body.seats)  : undefined,
        dailyRate:               body.dailyRate !== undefined ? Number(body.dailyRate) : undefined,
        status:                  body.status,
        mileage:                 body.mileage !== undefined ? Number(body.mileage) : undefined,
        lastOilChangeMileage:    body.lastOilChangeMileage !== undefined ? Number(body.lastOilChangeMileage) : undefined,
        nextOilChangeMileage:    body.nextOilChangeMileage !== undefined ? Number(body.nextOilChangeMileage) : undefined,
        technicalInspectionDate: body.technicalInspectionDate !== undefined
          ? (body.technicalInspectionDate ? new Date(body.technicalInspectionDate) : null)
          : undefined,
        insuranceExpiry: body.insuranceExpiry !== undefined
          ? (body.insuranceExpiry ? new Date(body.insuranceExpiry) : null)
          : undefined,
        vignetteExpiry: body.vignetteExpiry !== undefined
          ? (body.vignetteExpiry ? new Date(body.vignetteExpiry) : null)
          : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });
    return NextResponse.json(serializeVehicle(updated));
  } catch (err: any) {
    console.error("[PUT /api/vehicles/id]", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const activeRentals = await prisma.rental.count({
      where: { vehicleId: params.id, status: "ACTIVE" },
    });
    if (activeRentals > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer un véhicule actuellement en location." },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.damageLog.deleteMany({  where: { vehicleId: params.id } }),
      prisma.expense.deleteMany({    where: { vehicleId: params.id } }),
      prisma.rental.deleteMany({     where: { vehicleId: params.id } }),
      prisma.reservation.deleteMany({ where: { vehicleId: params.id } }),
      prisma.vehicle.delete({        where: { id: params.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/vehicles/id]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
