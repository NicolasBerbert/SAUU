import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const palestranteSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  bio: z.string().optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  role: z.string().optional(),
  order: z.number().int().default(0),
  active: z.boolean().optional(),
});

export async function GET() {
  const palestrantes = await prisma.palestrante.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(palestrantes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = palestranteSchema.parse(body);
    const palestrante = await prisma.palestrante.create({
      data: {
        name: data.name,
        bio: data.bio ?? null,
        imageUrl: data.imageUrl || null,
        role: data.role ?? null,
        order: data.order,
        active: data.active ?? true,
      },
    });
    return NextResponse.json(palestrante, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar palestrante" }, { status: 500 });
  }
}
