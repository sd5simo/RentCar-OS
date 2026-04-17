import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDamage } from "@/lib/db-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const damage = await prisma.damageLog.create({
      data: {
        vehicleId:   body.vehicleId,
        description: body.description,
        severity:    body.severity,
        zone:        body.zone,
        repaired:    Boolean(body.repaired ?? false),
        cost:        body.cost ? Number(body.cost) : null,
        rentalId:    body.rentalId ?? null,
        reportedAt:  new Date(),
        repairedAt:  null,
      },
    });
    return NextResponse.json(serializeDamage(damage), { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/damages]", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
