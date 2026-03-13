import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { presentationSchema } from "@/lib/validations";

// PUT /api/palestras/[id] - admin only
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = presentationSchema.parse(body);

    const presentation = await prisma.presentation.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(presentation);
  } catch (error) {
    console.error("[PUT /api/palestras/[id]]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/palestras/[id] - admin only
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  await prisma.presentation.update({
    where: { id: params.id },
    data: { active: false },
  });
  return NextResponse.json({ message: "Palestra removida" });
}
