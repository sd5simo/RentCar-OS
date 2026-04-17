import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeClient, makeRefCode } from "@/lib/db-helpers";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(clients.map(serializeClient));
  } catch (err: any) {
    console.error("[GET /api/clients]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = await prisma.client.create({
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
        isBlacklist:    false,
        blacklistReason: null,
        blacklistedAt:  null,
      },
    });
    return NextResponse.json(serializeClient(client), { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/clients]", err);
    const msg = err.code === "P2002"
      ? "Un client avec ce CIN existe déjà."
      : err.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
