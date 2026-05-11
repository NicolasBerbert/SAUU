import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

// POST /api/admin/usuarios/[id]/reembolso
// Emite reembolso Stripe para a inscrição do usuário
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId: id },
    select: { id: true, paymentId: true, paymentStatus: true, amount: true },
  });

  if (!registration) {
    return NextResponse.json({ error: "Inscrição não encontrada" }, { status: 404 });
  }

  if (registration.paymentStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "Apenas inscrições aprovadas podem ser reembolsadas." },
      { status: 409 }
    );
  }

  if (!registration.paymentId || registration.paymentId.startsWith("manual:")) {
    return NextResponse.json(
      { error: "Esta inscrição não possui pagamento Stripe para reembolsar." },
      { status: 409 }
    );
  }

  try {
    // paymentId é o Stripe session ID (cs_xxx); precisamos do PaymentIntent
    const stripeSession = await stripe.checkout.sessions.retrieve(registration.paymentId);
    const paymentIntentId = typeof stripeSession.payment_intent === "string"
      ? stripeSession.payment_intent
      : null;

    if (!paymentIntentId) {
      return NextResponse.json({ error: "PaymentIntent não encontrado." }, { status: 422 });
    }

    const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });

    await prisma.eventRegistration.update({
      where: { userId: id },
      data: { paymentStatus: "REFUNDED" },
    });

    await audit({
      actorId: session.user.id,
      actorType: "ADMIN",
      action: "REGISTRATION_REFUND_ISSUED",
      entityId: registration.id,
      entityType: "EventRegistration",
      metadata: {
        refundId: refund.id,
        paymentIntentId,
        amount: Number(registration.amount),
        ip: getClientIp(req),
      },
    });

    return NextResponse.json({ ok: true, refundId: refund.id });
  } catch (err) {
    logger.error("reembolso", err);
    return NextResponse.json({ error: "Erro ao processar reembolso." }, { status: 500 });
  }
}
