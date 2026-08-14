import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

const putSchema = z.object({
  slotId: z.string().cuid(),
  presente: z.boolean(),
});

// PUT /api/admin/presenca — marca ou desmarca presença em uma palestra
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { slotId, presente } = putSchema.parse(await req.json());

  await prisma.presentationSlot.update({
    where: { id: slotId },
    data: { attendedAt: presente ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}

const postSchema = z.object({
  userId: z.string().cuid(),
  presentationId: z.string().cuid(),
  marcarPresenca: z.boolean().optional().default(true),
});

// POST /api/admin/presenca — adiciona manualmente um usuário a uma palestra
// (cria o slot, opcionalmente já marcando presença). Reflete em dashboard,
// relatórios e horas, como se o usuário tivesse selecionado a palestra.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  let body;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { userId, presentationId, marcarPresenca } = body;

  const [user, presentation] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
    prisma.presentation.findUnique({ where: { id: presentationId }, select: { id: true, title: true } }),
  ]);
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (!presentation) return NextResponse.json({ error: "Palestra não encontrada" }, { status: 404 });

  try {
    const slot = await prisma.presentationSlot.create({
      data: {
        userId,
        presentationId,
        attendedAt: marcarPresenca ? new Date() : null,
      },
    });

    await audit({
      actorId: session.user.id,
      actorType: "ADMIN",
      action: "PRESENCA_MANUAL_ADICIONADA",
      entityId: slot.id,
      entityType: "PresentationSlot",
      metadata: {
        userId,
        userName: user.name,
        presentationId,
        presentationTitle: presentation.title,
        marcarPresenca,
        ip: getClientIp(req),
      },
    });

    return NextResponse.json({ ok: true, slotId: slot.id });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Este usuário já está inscrito nesta palestra." },
        { status: 409 }
      );
    }
    throw err;
  }
}

const deleteSchema = z.object({ slotId: z.string().cuid() });

// DELETE /api/admin/presenca — remove um usuário de uma palestra (apaga o slot).
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  let slotId: string;
  try {
    ({ slotId } = deleteSchema.parse(await req.json()));
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await prisma.presentationSlot.delete({ where: { id: slotId } });

  await audit({
    actorId: session.user.id,
    actorType: "ADMIN",
    action: "PRESENCA_MANUAL_REMOVIDA",
    entityId: slotId,
    entityType: "PresentationSlot",
    metadata: { ip: getClientIp(req) },
  });

  return NextResponse.json({ ok: true });
}
