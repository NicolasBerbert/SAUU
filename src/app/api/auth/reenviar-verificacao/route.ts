import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken, sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

// POST /api/auth/reenviar-verificacao — o próprio usuário pede um novo link.
// Resposta sempre genérica para não revelar quais e-mails existem.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`reenviar-pub:${ip}`, { windowSec: 300, max: 3 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let email: string;
  try {
    ({ email } = schema.parse(await req.json()));
  } catch {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const genericOk = NextResponse.json({
    ok: true,
    message: "Se houver uma conta com este e-mail ainda não confirmada, enviamos um novo link.",
  });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true, emailVerified: true },
  });

  // Não revela se o e-mail existe nem se já está verificado.
  if (!user || user.emailVerified) {
    return genericOk;
  }

  // Invalida tokens anteriores e cria um novo
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  const rawToken = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Aguarda o envio (serverless congela promises não-aguardadas).
  try {
    await sendVerificationEmail(user.email, user.name, rawToken);
  } catch (err) {
    logger.error("reenviar-verificacao (público)", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }

  return genericOk;
}
