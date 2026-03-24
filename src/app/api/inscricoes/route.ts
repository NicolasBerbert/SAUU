import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const inscricaoSchema = z.object({
  presentationId: z.string().cuid(),
});

// POST /api/inscricoes - inscrever em uma palestra (requer inscrição paga)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { presentationId } = inscricaoSchema.parse(await req.json());

  // Verificar vagas
  const presentation = await prisma.presentation.findUnique({
    where: { id: presentationId },
    include: { _count: { select: { slots: true } } },
  });
  if (!presentation) return NextResponse.json({ error: "Palestra não encontrada" }, { status: 404 });
  if (presentation._count.slots >= presentation.maxCapacity) {
    return NextResponse.json({ error: "Sem vagas disponíveis" }, { status: 409 });
  }

  const slot = await prisma.presentationSlot.create({
    data: { userId: session.user.id, presentationId },
  });
  return NextResponse.json(slot, { status: 201 });
}

// DELETE /api/inscricoes - cancelar inscrição em uma palestra
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { presentationId } = inscricaoSchema.parse(await req.json());

  await prisma.presentationSlot.delete({
    where: {
      userId_presentationId: {
        userId: session.user.id,
        presentationId,
      },
    },
  });
  return NextResponse.json({ message: "Inscrição cancelada" });
}
