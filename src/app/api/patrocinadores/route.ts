import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  tier: z.string().optional(),
  order: z.number().int().default(0),
  active: z.boolean().optional(),
});

export async function GET() {
  const sponsors = await prisma.patrocinador.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(sponsors);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const data = schema.parse(await req.json());
    const sponsor = await prisma.patrocinador.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl || null,
        website: data.website || null,
        tier: data.tier ?? null,
        order: data.order,
        active: data.active ?? true,
      },
    });
    return NextResponse.json(sponsor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar patrocinador" }, { status: 500 });
  }
}
