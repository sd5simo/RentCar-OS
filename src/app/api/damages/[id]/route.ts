import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDamage } from "@/lib/db-helpers";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await prisma.damageLog.update({
      where: { id: params.id },
      data: {
        repaired:   body.repaired !== undefined ? Boolean(body.repaired) : undefined,
        cost:       body.cost !== undefined ? (body.cost ? Number(body.cost) : null) : undefined,
        repairedAt: body.repaired ? new Date() : undefined,
      },
    });
    return NextResponse.json(serializeDamage(updated));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.damageLog.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
