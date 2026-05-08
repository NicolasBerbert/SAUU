import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET = "uploads";

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL env var não configurada");
  return url.replace(/\/$/, "");
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY env var não configurada");
  return key;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const mimeType = (file.type ?? "").toLowerCase();
    if (mimeType && !mimeType.startsWith("image/") && mimeType !== "application/octet-stream") {
      return NextResponse.json({ error: "Arquivo não é uma imagem." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo ${MAX_SIZE_BYTES / 1024 / 1024} MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Derive extension
    let ext = "jpg";
    if (mimeType.startsWith("image/")) {
      const rawExt = mimeType.slice("image/".length);
      ext = rawExt === "jpeg" ? "jpg" : rawExt === "svg+xml" ? "svg" : rawExt;
    } else if (file.name) {
      ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    }

    const hash = crypto.randomBytes(12).toString("hex");
    const filename = `products/${hash}.${ext}`;

    const supabaseUrl = getSupabaseUrl();
    const serviceKey = getServiceKey();

    // Upload to Supabase Storage via REST API
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${BUCKET}/${filename}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": mimeType || "application/octet-stream",
          "x-upsert": "true",
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      logger.error("Supabase Storage upload failed", errText);
      throw new Error(`Storage error ${uploadRes.status}: ${errText}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${filename}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    logger.error("POST /api/upload", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
