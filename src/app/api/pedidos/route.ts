import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createShopOrderPreference } from "@/lib/mercadopago";

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

// POST /api/pedidos - criar pedido e retornar link de pagamento do MP
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { items } = orderSchema.parse(await req.json());

  // Buscar produtos e calcular total
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });

  if (products.length !== items.length) {
    return NextResponse.json({ error: "Um ou mais produtos não encontrados" }, { status: 404 });
  }

  // Verificar estoque
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Estoque insuficiente para ${product.name}` },
        { status: 409 }
      );
    }
  }

  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return sum + Number(product.price) * item.quantity;
  }, 0);

  // Criar pedido no banco
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      total,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: products.find((p) => p.id === item.productId)!.price,
        })),
      },
    },
  });

  // Criar preferência no Mercado Pago
  const mpItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      id: product.id,
      title: product.name,
      quantity: item.quantity,
      unit_price: Number(product.price),
    };
  });

  const preference = await createShopOrderPreference({
    userId: session.user.id,
    userName: user!.name,
    userEmail: user!.email,
    orderId: order.id,
    items: mpItems,
    total,
  });

  return NextResponse.json({ orderId: order.id, checkoutUrl: preference.init_point });
}
