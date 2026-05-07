import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSiteConfig, setSiteConfig } from "@/lib/siteConfig";

const ALLOWED_KEYS = ["lojaAtiva"] as const;

// GET /api/admin/configuracoes — returns all managed config values
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const lojaAtiva = await getSiteConfig("lojaAtiva", "true");
  return NextResponse.json({ lojaAtiva: lojaAtiva === "true" });
}

// PATCH /api/admin/configuracoes — update a config value
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { key, value } = body as { key: string; value: boolean };

  if (!ALLOWED_KEYS.includes(key as (typeof ALLOWED_KEYS)[number])) {
    return NextResponse.json({ error: "Chave inválida" }, { status: 400 });
  }

  await setSiteConfig(key, String(value));
  return NextResponse.json({ key, value });
}
