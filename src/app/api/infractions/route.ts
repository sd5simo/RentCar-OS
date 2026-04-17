import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeInfraction } from "@/lib/db-helpers";

export async function GET() {
  try {
    const infractions = await prisma.infraction.findMany({ orderBy: { date: "desc" } });
    return NextResponse.json(infractions.map(serializeInfraction));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const infraction = await prisma.infraction.create({
      data: {
        clientId:    body.clientId,
        rentalId:    body.rentalId  ?? null,
        type:        body.type,
        description: body.description,
        amount:      body.amount ? Number(body.amount) : null,
        date:        new Date(body.date),
        resolved:    Boolean(body.resolved ?? false),
      },
    });
    return NextResponse.json(serializeInfraction(infraction), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
