import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyTotpCode } from "@/lib/totp";
import { audit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  secret: z.string().min(16),
  code:   z.string().length(6).regex(/^\d+$/),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const allowedTypes = ["ADMIN", "TOTP_SETUP_REQUIRED"];
  if (!session || !allowedTypes.includes(session.user?.type as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  // Verify in DB that user is actually ADMIN
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { type: true } });
  if (dbUser?.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { secret, code } = parsed.data;

  if (!verifyTotpCode(code, secret)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  // Código válido → salva o secret
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret },
  });

  await audit({
    actorId: session.user.id,
    actorType: "ADMIN",
    action: "TOTP_ENABLED",
    entityId: session.user.id,
    entityType: "User",
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z.object({ code: z.string().length(6).regex(/^\d+$/) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.totpSecret) {
    return NextResponse.json({ error: "2FA não configurado" }, { status: 400 });
  }

  if (!verifyTotpCode(parsed.data.code, user.totpSecret)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: null },
  });

  await audit({
    actorId: session.user.id,
    actorType: "ADMIN",
    action: "TOTP_DISABLED",
    entityId: session.user.id,
    entityType: "User",
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
