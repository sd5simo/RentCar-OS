import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeExpense } from "@/lib/db-helpers";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        category:    body.category,
        description: body.description,
        amount:      body.amount !== undefined ? Number(body.amount) : undefined,
        date:        body.date ? new Date(body.date) : undefined,
        vendor:      body.vendor ?? undefined,
        vehicleId:   body.vehicleId !== undefined ? (body.vehicleId || null) : undefined,
      },
    });
    return NextResponse.json(serializeExpense(updated));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.expense.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
