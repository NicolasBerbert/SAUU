import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { sendConfirmationEmail } from "@/lib/email";
import { getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

// POST /api/admin/usuarios/[id]/marcar-pago
// Marca inscrição como APPROVED manualmente (isenta/cortesia)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const registration = await prisma.eventRegistration.upsert({
    where: { userId: id },
    update: { paymentStatus: "APPROVED", paymentId: `manual:${session.user.id}` },
    create: {
      userId: id,
      paymentStatus: "APPROVED",
      paymentId: `manual:${session.user.id}`,
      amount: 0,
    },
  });

  await audit({
    actorId: session.user.id,
    actorType: "ADMIN",
    action: "REGISTRATION_MANUALLY_APPROVED",
    entityId: registration.id,
    entityType: "EventRegistration",
    metadata: { targetUserId: id, targetName: user.name, ip: getClientIp(req) },
  });

  // Envia confirmação por e-mail em background
  sendConfirmationEmail(user.email, user.name).catch((err) =>
    logger.error("marcar-pago sendConfirmationEmail", err)
  );

  return NextResponse.json({ ok: true });
}
