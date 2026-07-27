import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { presentationSchema } from "@/lib/validations";
import { resolveSpeakers } from "@/lib/presentations";

// PUT /api/palestras/[id] - admin only
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { palestranteIds, ...rest } = presentationSchema.parse(body);
    const { speaker, create } = await resolveSpeakers(palestranteIds);

    // Substitui o conjunto de palestrantes de forma atômica.
    const [, presentation] = await prisma.$transaction([
      prisma.presentationSpeaker.deleteMany({ where: { presentationId: id } }),
      prisma.presentation.update({
        where: { id },
        data: { ...rest, speaker, speakers: { create } },
      }),
    ]);
    return NextResponse.json(presentation);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
    }
    if (error instanceof Error && error.message === "PALESTRANTE_NOT_FOUND") {
      return NextResponse.json({ error: "Palestrante inválido" }, { status: 422 });
    }
    console.error("[PUT /api/palestras/[id]]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/palestras/[id] - admin only
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    // Remove enrolled slots first to satisfy FK constraint, then delete
    await prisma.presentationSlot.deleteMany({ where: { presentationId: id } });
    await prisma.presentation.delete({ where: { id } });
    return NextResponse.json({ message: "Palestra removida" });
  } catch (error) {
    console.error("[DELETE /api/palestras/[id]]", error);
    return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });
  }
}
