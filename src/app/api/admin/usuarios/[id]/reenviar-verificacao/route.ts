import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashToken, sendAdminVerificationEmail } from "@/lib/email";
import { audit } from "@/lib/audit";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";

// POST /api/admin/usuarios/[id]/reenviar-verificacao
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const rl = checkRateLimit(`reenviar-verificacao:${id}`, { windowSec: 300, max: 2 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Aguarde antes de reenviar novamente." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "E-mail já verificado." }, { status: 409 });
  }

  // Invalida tokens anteriores
  await prisma.emailVerificationToken.deleteMany({ where: { userId: id } });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { userId: id, token: tokenHash, expiresAt },
  });

  try {
    await sendAdminVerificationEmail(user.email, user.name, rawToken);
  } catch (err) {
    logger.error("reenviar-verificacao", err);
    return NextResponse.json({ error: "Erro ao enviar e-mail." }, { status: 500 });
  }

  await audit({
    actorId: session.user.id,
    actorType: "ADMIN",
    action: "VERIFICATION_EMAIL_RESENT",
    entityId: id,
    entityType: "User",
    metadata: { targetEmail: user.email, ip: getClientIp(req) },
  });

  return NextResponse.json({ ok: true });
}
