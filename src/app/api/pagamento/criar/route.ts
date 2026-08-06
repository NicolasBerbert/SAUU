// POST /api/pagamento/criar
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { criarPagamentoPix } from "@/lib/mercadopago";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rl = checkRateLimit(`pagamento_criar:${session.user.id}`, { windowSec: 900, max: 5 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde antes de tentar novamente." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerified: true, cpf: true },
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
    const registration = await prisma.eventRegistration.upsert({
      where: { userId: session.user.id },
      update: { paymentStatus: "PENDING", amount },
      create: { userId: session.user.id, amount, paymentStatus: "PENDING" },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    const pix = await criarPagamentoPix({
      amount,
      description: "Inscrição — SAUU CLBB",
      payerEmail: user.email,
      payerFirstName: user.name,
      payerCpf: user.cpf,
      ref: { userId: session.user.id, tipo: "inscricao" },
      baseUrl,
    });

    await audit({
      actorId: session.user.id,
      actorType: "USER",
      action: "REGISTRATION_PAYMENT_INITIATED",
      entityId: registration.id,
      entityType: "EventRegistration",
      metadata: { amount, ip: getClientIp(req) },
    });

    return NextResponse.json({ checkoutUrl: pix.ticketUrl });
  } catch (err) {
    logger.error("POST /api/pagamento/criar", err);
    return NextResponse.json({ error: "Erro ao iniciar pagamento" }, { status: 500 });
  }
}
