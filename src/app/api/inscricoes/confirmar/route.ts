import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/inscricoes/confirmar — confirma e trava a seleção de palestras.
// Depois disso o usuário não pode mais adicionar/remover palestras.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId: session.user.id },
    select: { id: true, paymentStatus: true, presentationsConfirmedAt: true },
  });
  if (!registration || registration.paymentStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "Inscrição no evento não confirmada. Realize o pagamento primeiro." },
      { status: 403 }
    );
  }
  if (registration.presentationsConfirmedAt) {
    return NextResponse.json({ error: "Suas palestras já foram confirmadas." }, { status: 409 });
  }

  const slotCount = await prisma.presentationSlot.count({
    where: { userId: session.user.id },
  });
  if (slotCount === 0) {
    return NextResponse.json(
      { error: "Selecione ao menos uma palestra antes de confirmar." },
      { status: 400 }
    );
  }

  await prisma.eventRegistration.update({
    where: { id: registration.id },
    data: { presentationsConfirmedAt: new Date() },
  });

  return NextResponse.json({ message: "Palestras confirmadas" });
}
