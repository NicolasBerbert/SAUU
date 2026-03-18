import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateTotpSecret, getTotpUri } from "@/lib/totp";
import QRCode from "qrcode";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.type !== "ADMIN") {
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
