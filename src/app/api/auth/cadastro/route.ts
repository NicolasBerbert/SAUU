import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserType } from "@prisma/client";
import {
  unifilRegisterSchema,
  uelRegisterSchema,
  graduateRegisterSchema,
} from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // 10 tentativas de cadastro por IP a cada 15 minutos
  const ip = getClientIp(req);
  const limit = checkRateLimit(`cadastro:${ip}`, { windowSec: 900, max: 10 });
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
    } else if (type === UserType.UEL) {
      parsed = uelRegisterSchema.parse(body);
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

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        password: hashedPassword,
        institution: parsed.institution,
        type: parsed.type,
      },
    });

    return NextResponse.json({ message: "Conta criada com sucesso" }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
    }
    console.error("[POST /api/auth/cadastro]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
