import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserType } from "@prisma/client";
import {
  unifilRegisterSchema,
  externoRegisterSchema,
  graduateRegisterSchema,
} from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { sendVerificationEmail, hashToken } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  // 5 por IP por instância (10 efetivos com 2 instâncias PM2)
  const ip = getClientIp(req);
  const limit = checkRateLimit(`cadastro:${ip}`, { windowSec: 900, max: 5 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  try {
    const body = await req.json();
    const { type } = body;

    // Validar por tipo
    let parsed;
    if (type === UserType.UNIFIL) {
      parsed = unifilRegisterSchema.parse(body);
    } else if (type === "EXTERNO") {
      parsed = externoRegisterSchema.parse(body);
    } else if (type === UserType.FORMADO) {
      parsed = graduateRegisterSchema.parse(body);
    } else {
      return NextResponse.json({ error: "Tipo de usuário inválido" }, { status: 400 });
    }

    // Verificar e-mail duplicado
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 12);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        cpf: parsed.cpf,
        password: hashedPassword,
        institution: parsed.institution,
        type: parsed.type as UserType,
        // RA only for external students
        ...("ra" in parsed && parsed.ra ? { ra: parsed.ra } : {}),
      },
    });

    // Gerar e enviar token de verificação de email
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token: tokenHash, expiresAt },
    });

    // IMPORTANTE: aguardar o envio. Em ambiente serverless (Vercel) uma promise
    // não-aguardada após a resposta é congelada e o e-mail não chega — era por
    // isso que o cadastro não enviava, mas o reenvio pelo admin (que aguarda)
    // funcionava. Se o envio falhar, a conta ainda é criada (usa-se o reenvio).
    try {
      await sendVerificationEmail(user.email, user.name, rawToken);
    } catch (err) {
      logger.error("sendVerificationEmail", err);
    }

    return NextResponse.json({ message: "Conta criada com sucesso" }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
    }
    logger.error("POST /api/auth/cadastro", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
