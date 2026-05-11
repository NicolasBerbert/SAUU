import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateTotpSecret, getTotpUri } from "@/lib/totp";
import QRCode from "qrcode";

export async function POST() {
  const session = await getServerSession(authOptions);
  const allowedTypes = ["ADMIN", "TOTP_SETUP_REQUIRED"];
  if (!session || !allowedTypes.includes(session.user?.type as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  // Verify in DB that user is actually ADMIN
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { type: true } });
  if (dbUser?.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Gera novo secret (não salva ainda — só após confirmar o código)
  const secret = generateTotpSecret();
  const uri = getTotpUri(session.user.email!, secret);
  const qrDataUrl = await QRCode.toDataURL(uri, { margin: 2, width: 200 });

  // Guarda o secret temporariamente na sessão via cookie httpOnly seria ideal,
  // mas para simplicidade retornamos o secret para confirmar no próximo passo.
  // O secret só é salvo no banco após o usuário confirmar com um código válido.
  return NextResponse.json({ secret, qrDataUrl });
}
