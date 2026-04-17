import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeVehicle } from "@/lib/db-helpers";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { damageLogs: { orderBy: { reportedAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(vehicles.map(serializeVehicle));
  } catch (err: any) {
    console.error("[GET /api/vehicles]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vehicle = await prisma.vehicle.create({
      include: { damageLogs: true },
      data: {
        plate:                   body.plate,
        brand:                   body.brand,
        model:                   body.model,
        year:                    Number(body.year),
        category:                body.category,
        color:                   body.color,
        fuelType:                body.fuelType,
        transmission:            body.transmission,
        seats:                   Number(body.seats) || 5,
        dailyRate:               Number(body.dailyRate),
        status:                  body.status ?? "AVAILABLE",
        mileage:                 Number(body.mileage) || 0,
        lastOilChangeMileage:    Number(body.lastOilChangeMileage) || 0,
        nextOilChangeMileage:    Number(body.nextOilChangeMileage) || 10000,
        technicalInspectionDate: body.technicalInspectionDate ? new Date(body.technicalInspectionDate) : null,
        insuranceExpiry:         body.insuranceExpiry         ? new Date(body.insuranceExpiry)         : null,
        vignetteExpiry:          body.vignetteExpiry          ? new Date(body.vignetteExpiry)          : null,
        notes:                   body.notes ?? null,
      },
    });
    return NextResponse.json(serializeVehicle(vehicle), { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/vehicles]", err);
    const msg = err.code === "P2002"
      ? "Un véhicule avec cette plaque existe déjà."
      : err.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
