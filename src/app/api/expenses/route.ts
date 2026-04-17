import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeExpense } from "@/lib/db-helpers";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
    return NextResponse.json(expenses.map(serializeExpense));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const expense = await prisma.expense.create({
      data: {
        vehicleId:   body.vehicleId ?? null,
        category:    body.category,
        description: body.description,
        amount:      Number(body.amount),
        date:        new Date(body.date),
        vendor:      body.vendor ?? null,
      },
    });
    return NextResponse.json(serializeExpense(expense), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
