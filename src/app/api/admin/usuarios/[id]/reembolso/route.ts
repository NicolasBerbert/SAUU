import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reembolsarPagamento } from "@/lib/mercadopago";
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

  // Pagamentos do Mercado Pago são gravados como "mp:<id>". Manuais/cortesia
  // (manual:...) não têm cobrança para estornar.
  if (!registration.paymentId || !registration.paymentId.startsWith("mp:")) {
    return NextResponse.json(
      { error: "Esta inscrição não possui pagamento do Mercado Pago para reembolsar." },
      { status: 409 }
    );
  }

  try {
    const mpPaymentId = registration.paymentId.replace(/^mp:/, "");
    const refund = await reembolsarPagamento(mpPaymentId);

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
        mpPaymentId,
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
