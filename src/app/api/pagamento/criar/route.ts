import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createEventRegistrationPreference } from "@/lib/mercadopago";

// POST /api/pagamento/criar - gera link de pagamento da inscrição no evento
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const existing = await prisma.eventRegistration.findUnique({
    where: { userId: session.user.id },
  });
  if (existing?.paymentStatus === "APPROVED") {
    return NextResponse.json({ error: "Inscrição já confirmada" }, { status: 409 });
  }

  const amount = Number(process.env.EVENT_REGISTRATION_PRICE ?? "50");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  // Criar ou atualizar registro pendente
  await prisma.eventRegistration.upsert({
    where: { userId: session.user.id },
    update: { paymentStatus: "PENDING", amount },
    create: { userId: session.user.id, amount, paymentStatus: "PENDING" },
  });

  const preference = await createEventRegistrationPreference({
    userId: session.user.id,
    userName: user!.name,
    userEmail: user!.email,
    amount,
  });

  return NextResponse.json({ checkoutUrl: preference.init_point });
}
