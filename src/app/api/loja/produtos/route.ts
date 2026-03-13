import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validations";

// GET /api/loja/produtos - público
export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

// POST /api/loja/produtos - admin only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const data = productSchema.parse(await req.json());
  const product = await prisma.product.create({ data });
  return NextResponse.json(product, { status: 201 });
}
