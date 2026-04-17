import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeInfraction } from "@/lib/db-helpers";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await prisma.infraction.update({
      where: { id: params.id },
      data: {
        resolved:    body.resolved !== undefined ? Boolean(body.resolved) : undefined,
        description: body.description,
        amount:      body.amount !== undefined ? (body.amount ? Number(body.amount) : null) : undefined,
        type:        body.type,
      },
    });
    return NextResponse.json(serializeInfraction(updated));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.infraction.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
