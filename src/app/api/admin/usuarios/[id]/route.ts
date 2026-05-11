import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["ADMIN", "UNIFIL", "EXTERNO", "FORMADO"] as const;
type UserType = (typeof ALLOWED_TYPES)[number];

// PATCH /api/admin/usuarios/[id] — altera tipo de conta (somente admin)
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

  // Protege o último admin: não permite remover o último ADMIN ativo
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, type: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (target.type === "ADMIN" && type !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { type: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Não é possível remover o último administrador." },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { type: type as UserType },
    select: { id: true, name: true, type: true },
  });

  await audit({
    actorId: session.user.id,
    actorType: "ADMIN",
    action: "USER_TYPE_CHANGED",
    entityId: id,
    entityType: "User",
    metadata: {
      previousType: target.type,
      newType: type,
      targetName: target.name,
      ip: getClientIp(req),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/usuarios/[id] — desativa conta (somente admin)
export async function DELETE(
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
      { error: "Você não pode desativar sua própria conta" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, type: true, active: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (target.type === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { type: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Não é possível desativar o último administrador." },
        { status: 409 }
      );
    }
  }

  await prisma.user.update({
    where: { id },
    data: { active: false },
  });

  await audit({
    actorId: session.user.id,
    actorType: "ADMIN",
    action: "USER_DEACTIVATED",
    entityId: id,
    entityType: "User",
    metadata: { targetName: target.name, ip: getClientIp(req) },
  });

  return NextResponse.json({ ok: true });
}
