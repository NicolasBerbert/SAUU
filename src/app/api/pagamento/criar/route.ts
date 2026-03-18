import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createEventRegistrationPreference } from "@/lib/mercadopago";
import { verifyCsrf } from "@/lib/csrf";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { sendAdminAlert } from "@/lib/alert";

// POST /api/pagamento/criar - gera link de pagamento da inscrição no evento
export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Rate limit: 5 tentativas por usuário por 15 minutos (10 efetivos com PM2 ×2)
  const rl = checkRateLimit(`pagamento_criar:${session.user.id}`, { windowSec: 900, max: 5 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde antes de tentar novamente." },
      { status: 429 }
    );
  }

  // Verificação de email obrigatória antes de pagar
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerified: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Confirme seu e-mail antes de realizar o pagamento." },
      { status: 403 }
    );
  }

  const existing = await prisma.eventRegistration.findUnique({
    where: { userId: session.user.id },
  });
  if (existing?.paymentStatus === "APPROVED") {
    return NextResponse.json({ error: "Inscrição já confirmada" }, { status: 409 });
  }

  const amount = Number(process.env.EVENT_REGISTRATION_PRICE ?? "50");

  try {
    // Criar ou atualizar registro pendente
    const registration = await prisma.eventRegistration.upsert({
      where: { userId: session.user.id },
      update: { paymentStatus: "PENDING", amount },
      create: { userId: session.user.id, amount, paymentStatus: "PENDING" },
    });

    const preference = await createEventRegistrationPreference({
      userId: session.user.id,
      userName: user.name,
      userEmail: user.email,
      amount,
    });

    await audit({
      actorId: session.user.id,
      actorType: "USER",
      action: "REGISTRATION_PAYMENT_INITIATED",
      entityId: registration.id,
      entityType: "EventRegistration",
      metadata: { amount, ip: getClientIp(req) },
    });

    return NextResponse.json({ checkoutUrl: preference.init_point });
  } catch (err) {
    logger.error("POST /api/pagamento/criar", err);
    await sendAdminAlert(
      "Falha ao criar preferência de pagamento de inscrição",
      `Usuário: ${session.user.id}\nEmail: ${user.email}\nErro: ${err instanceof Error ? err.message : String(err)}`,
      "ERRO"
    );
    return NextResponse.json({ error: "Erro ao iniciar pagamento" }, { status: 500 });
  }
}
