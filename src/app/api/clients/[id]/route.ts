import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeClient } from "@/lib/db-helpers";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.client.findUniqueOrThrow({ where: { id: params.id } });
    return NextResponse.json(serializeClient(client));
  } catch (err: any) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await prisma.client.update({
      where: { id: params.id },
      data: {
        cin:            body.cin,
        firstName:      body.firstName,
        lastName:       body.lastName,
        email:          body.email   ?? null,
        phone:          body.phone,
        address:        body.address ?? null,
        city:           body.city    ?? null,
        licenseNum:     body.licenseNum ?? null,
        licenseExp:     body.licenseExp ? new Date(body.licenseExp) : null,
        notes:          body.notes   ?? null,
        isBlacklist:    body.isBlacklist   ?? undefined,
        blacklistReason: body.blacklistReason ?? undefined,
        blacklistedAt:  body.blacklistedAt ? new Date(body.blacklistedAt) : undefined,
      },
    });
    return NextResponse.json(serializeClient(updated));
  } catch (err: any) {
    console.error("[PUT /api/clients/id]", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check for active rentals before deleting
    const activeRentals = await prisma.rental.count({
      where: { clientId: params.id, status: "ACTIVE" },
    });
    if (activeRentals > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer un client ayant des locations actives." },
        { status: 409 }
      );
    }

    // Cascade-delete related records in order
    await prisma.$transaction([
      prisma.infraction.deleteMany({ where: { clientId: params.id } }),
      prisma.rental.deleteMany({     where: { clientId: params.id } }),
      prisma.reservation.deleteMany({ where: { clientId: params.id } }),
      prisma.client.delete({         where: { id: params.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/clients/id]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
