import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(32),
  newPassword: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .regex(/[0-9]/, "A senha deve conter ao menos um número"),
});

// POST /api/auth/redefinir-senha — define a nova senha a partir do token.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`redefinir-senha:${ip}`, { windowSec: 900, max: 5 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  let token: string;
  let newPassword: string;
  try {
    ({ token, newPassword } = schema.parse(await req.json()));
  } catch (err) {
    const msg =
      err instanceof z.ZodError ? err.errors[0]?.message ?? "Dados inválidos" : "Dados inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!record) {
    return NextResponse.json(
      { error: "Link inválido ou já utilizado. Solicite uma nova redefinição." },
      { status: 400 }
    );
  }

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return NextResponse.json(
      { error: "Link expirado. Solicite uma nova redefinição." },
      { status: 400 }
    );
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      // Invalida todos os tokens de reset desse usuário.
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);
  } catch (err) {
    logger.error("redefinir-senha", err);
    return NextResponse.json({ error: "Erro ao redefinir a senha." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
