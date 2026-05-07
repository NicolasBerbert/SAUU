import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Output format: square 800×800 WebP with center-crop
const OUTPUT_SIZE = 800;

// POST /api/upload — upload and process a product image (admin only)
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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use JPEG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 5 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const hash = crypto.randomBytes(12).toString("hex");
    const filename = `${hash}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Process with sharp: resize to square 800×800, center-crop, convert to WebP
    await sharp(buffer)
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    const url = `/uploads/products/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    logger.error("POST /api/upload", error);
    return NextResponse.json({ error: "Erro ao processar imagem" }, { status: 500 });
  }
}
