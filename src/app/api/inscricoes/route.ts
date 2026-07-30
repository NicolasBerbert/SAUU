import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { presentationsConflict } from "@/lib/utils";

const inscricaoSchema = z.object({
  presentationId: z.string().cuid(),
});

// POST /api/inscricoes - inscrever em uma palestra (requer inscrição paga)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Verificar pagamento aprovado e se a seleção ainda não foi travada
  const registration = await prisma.eventRegistration.findUnique({
    where: { userId: session.user.id },
    select: { paymentStatus: true, presentationsConfirmedAt: true },
  });
  if (!registration || registration.paymentStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "Inscrição no evento não confirmada. Realize o pagamento primeiro." },
      { status: 403 }
    );
  }
  if (registration.presentationsConfirmedAt) {
    return NextResponse.json(
      { error: "Suas palestras já foram confirmadas e não podem mais ser alteradas." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = inscricaoSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { presentationId } = body;

  // Verificar vagas
  const presentation = await prisma.presentation.findUnique({
    where: { id: presentationId, active: true },
    include: { _count: { select: { slots: true } } },
  });
  if (!presentation) return NextResponse.json({ error: "Palestra não encontrada" }, { status: 404 });
  if (presentation._count.slots >= presentation.maxCapacity) {
    return NextResponse.json({ error: "Sem vagas disponíveis" }, { status: 409 });
  }

  // Impedir conflito de horário: usuário não pode assistir a duas palestras
  // que acontecem ao mesmo tempo.
  const existing = await prisma.presentationSlot.findMany({
    where: { userId: session.user.id },
    select: { presentation: { select: { title: true, day: true, slot: true, duration: true } } },
  });
  const conflito = existing.find((s) => presentationsConflict(presentation, s.presentation));
  if (conflito) {
    return NextResponse.json(
      { error: `Conflito de horário com "${conflito.presentation.title}". Você não pode assistir a duas palestras ao mesmo tempo.` },
      { status: 409 }
    );
  }

  try {
    const slot = await prisma.presentationSlot.create({
      data: { userId: session.user.id, presentationId },
    });
    return NextResponse.json(slot, { status: 201 });
  } catch (err: unknown) {
    // Já inscrito (violação de unicidade) — trata como sucesso idempotente
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ message: "Já inscrito" }, { status: 200 });
    }
    throw err;
  }
}

// DELETE /api/inscricoes - cancelar inscrição em uma palestra
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Cancelar só faz sentido se tinha inscrição paga e ainda não confirmou
  const registration = await prisma.eventRegistration.findUnique({
    where: { userId: session.user.id },
    select: { paymentStatus: true, presentationsConfirmedAt: true },
  });
  if (!registration || registration.paymentStatus !== "APPROVED") {
    return NextResponse.json({ error: "Inscrição no evento não confirmada." }, { status: 403 });
  }
  if (registration.presentationsConfirmedAt) {
    return NextResponse.json(
      { error: "Suas palestras já foram confirmadas e não podem mais ser alteradas." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = inscricaoSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { presentationId } = body;

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
