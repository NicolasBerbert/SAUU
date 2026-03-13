import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/certificados - emitir certificado (apenas alunos UEL com inscrição aprovada)
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  if (session.user.type !== "UEL") {
    return NextResponse.json(
      { error: "Certificados disponíveis apenas para alunos UEL" },
      { status: 403 }
    );
  }

  const eventReg = await prisma.eventRegistration.findUnique({
    where: { userId: session.user.id },
  });
  if (eventReg?.paymentStatus !== "APPROVED") {
    return NextResponse.json({ error: "Inscrição não confirmada" }, { status: 403 });
  }

  const certificate = await prisma.certificate.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  // TODO: gerar PDF do certificado e retornar URL ou stream
  return NextResponse.json({ certificate, message: "Certificado gerado" });
}
