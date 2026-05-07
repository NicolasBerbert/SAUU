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
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/tiff",
  "image/bmp",
  "image/svg+xml",
  // Allow unknown/blank MIME — sharp will detect format from buffer
  "application/octet-stream",
  "",
];
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

    // Reject only clearly non-image MIME types (allow blank/unknown for broad compat)
    const mimeType = file.type ?? "";
    if (mimeType && !mimeType.startsWith("image/") && mimeType !== "application/octet-stream") {
      return NextResponse.json(
        { error: "Arquivo não é uma imagem. Use JPEG, PNG, WebP, AVIF, GIF, etc." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo ${MAX_SIZE_BYTES / 1024 / 1024} MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const hash = crypto.randomBytes(12).toString("hex");

    let filename: string;
    let filepath: string;

    // Try sharp processing first; fall back to saving original on failure
    try {
      filename = `${hash}.webp`;
      filepath = path.join(UPLOAD_DIR, filename);

      await sharp(buffer)
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
          fit: "cover",
          position: "centre",
        })
        .webp({ quality: 85 })
        .toFile(filepath);
    } catch (sharpError) {
      logger.error("sharp processing failed, saving original", sharpError);

      // Derive extension from MIME or filename
      const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      filename = `${hash}.${ext}`;
      filepath = path.join(UPLOAD_DIR, filename);
      await fs.writeFile(filepath, buffer);
    }

    const url = `/uploads/products/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    logger.error("POST /api/upload", error);
    return NextResponse.json({ error: "Erro ao salvar imagem. Tente outro formato." }, { status: 500 });
  }
}
