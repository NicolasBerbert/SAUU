import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  role: z.string().optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  order: z.number().int().default(0),
  active: z.boolean().optional(),
});

export async function GET() {
  const members = await prisma.comissaoMember.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const data = schema.parse(await req.json());
    const member = await prisma.comissaoMember.create({
      data: {
        name: data.name,
        role: data.role ?? null,
        imageUrl: data.imageUrl || null,
        order: data.order,
        active: data.active ?? true,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar membro" }, { status: 500 });
  }
}
