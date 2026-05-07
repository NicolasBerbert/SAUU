import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ALLOWED_TYPES = ["ADMIN", "UNIFIL", "EXTERNO", "FORMADO"] as const;
type UserType = (typeof ALLOWED_TYPES)[number];

// PATCH /api/admin/usuarios/[id] — change a user's type (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Você não pode alterar seu próprio tipo de conta" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const type = body.type as string;

  if (!ALLOWED_TYPES.includes(type as UserType)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { type: type as UserType },
    select: { id: true, name: true, type: true },
  });

  return NextResponse.json(updated);
}
