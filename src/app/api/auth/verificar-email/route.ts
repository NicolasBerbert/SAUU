import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/email";
import { logger } from "@/lib/logger";

// GET /api/auth/verificar-email?token=xxx
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token || token.length < 32) {
    return NextResponse.redirect(
      new URL("/verificar-email?erro=token_invalido", req.url)
    );
  }

  try {
    const tokenHash = hashToken(token);

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token: tokenHash },
      include: { user: { select: { id: true, emailVerified: true } } },
    });

    if (!record) {
      return NextResponse.redirect(
        new URL("/verificar-email?erro=token_invalido", req.url)
      );
    }

    if (record.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: record.id } });
      return NextResponse.redirect(
        new URL("/verificar-email?erro=token_expirado", req.url)
      );
    }

    // Marcar email como verificado e deletar o token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationToken.delete({ where: { id: record.id } }),
    ]);

    return NextResponse.redirect(
      new URL("/verificar-email?sucesso=1", req.url)
    );
  } catch (error) {
    logger.error("GET /api/auth/verificar-email", error);
    return NextResponse.redirect(
      new URL("/verificar-email?erro=interno", req.url)
    );
  }
}
