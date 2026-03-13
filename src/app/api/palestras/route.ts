import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { presentationSchema } from "@/lib/validations";

// GET /api/palestras - público, retorna palestras com contagem de vagas
export async function GET() {
  const presentations = await prisma.presentation.findMany({
    where: { active: true },
    include: { _count: { select: { slots: true } } },
    orderBy: [{ day: "asc" }, { slot: "asc" }],
  });

  const withSpotsLeft = presentations.map((p) => ({
    ...p,
    spotsLeft: p.maxCapacity - p._count.slots,
  }));

  return NextResponse.json(withSpotsLeft);
}

// POST /api/palestras - admin only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = presentationSchema.parse(body);

    const presentation = await prisma.presentation.create({ data });
    return NextResponse.json(presentation, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
    }
    console.error("[POST /api/palestras]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
