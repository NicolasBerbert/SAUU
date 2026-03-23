import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: z
    .string()
    .min(8, "Nova senha deve ter ao menos 8 caracteres")
    .regex(/[0-9]/, "Nova senha deve conter ao menos um número"),
}).refine((d) => d.currentPassword !== d.newPassword, {
  message: "A nova senha deve ser diferente da atual",
  path: ["newPassword"],
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let parsed;
  try {
    parsed = changePasswordSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const match = await bcrypt.compare(parsed.currentPassword, user.password);
    if (!match) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
    }

    const hashedNew = await bcrypt.hash(parsed.newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNew },
    });

    return NextResponse.json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    logger.error("PUT /api/perfil/senha", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
