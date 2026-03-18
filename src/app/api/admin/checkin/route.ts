import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

const schema = z.object({
  userId: z.string().cuid(),
});

// POST /api/admin/checkin — marca presença de um participante no evento
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const registration = await prisma.eventRegistration.findUnique({
      where: { userId: parsed.userId },
      select: { paymentStatus: true, attendedAt: true },
    });

    if (!registration) {
      return NextResponse.json({ error: "Usuário sem inscrição no evento" }, { status: 404 });
    }
    if (registration.paymentStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Inscrição não aprovada — pagamento pendente ou cancelado" },
        { status: 409 }
      );
    }
    if (registration.attendedAt) {
      return NextResponse.json(
        { error: "Presença já registrada", attendedAt: registration.attendedAt },
        { status: 409 }
      );
    }

    const now = new Date();
    await prisma.eventRegistration.update({
      where: { userId: parsed.userId },
      data: { attendedAt: now },
    });

    await audit({
      actorId: session.user.id,
      actorType: "ADMIN",
      action: "CHECKIN_CONFIRMED",
      entityId: parsed.userId,
      entityType: "EventRegistration",
      metadata: { adminId: session.user.id, attendedAt: now.toISOString() },
    });

    return NextResponse.json({ ok: true, attendedAt: now });
  } catch (error) {
    logger.error("POST /api/admin/checkin", error);
    return NextResponse.json({ error: "Erro ao registrar presença" }, { status: 500 });
  }
}

// GET /api/admin/checkin?q=busca — busca participante por nome ou email
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      type: { not: "ADMIN" },
      active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      type: true,
      eventRegistration: {
        select: { paymentStatus: true, attendedAt: true },
      },
    },
    take: 10,
  });

  return NextResponse.json({ results: users });
}
