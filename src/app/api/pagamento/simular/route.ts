import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Rota placeholder — APENAS DESENVOLVIMENTO.
// Simula aprovação do pagamento sem passar pelo Mercado Pago.
// Remove este arquivo quando o MP estiver configurado.

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Não disponível" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.eventRegistration.upsert({
    where: { userId: session.user.id },
    update: { paymentStatus: "APPROVED" },
    create: {
      userId: session.user.id,
      paymentStatus: "APPROVED",
      amount: Number(process.env.EVENT_REGISTRATION_PRICE ?? 50),
    },
  });

  return NextResponse.json({ ok: true });
}
