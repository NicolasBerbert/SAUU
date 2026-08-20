import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ─────────────────────────────────────────────────────────────
// Stripe — pagamento por CARTÃO, apenas para os PRODUTOS da loja.
// (A inscrição no evento é paga via PIX/Mercado Pago, em outro fluxo.)
// ─────────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;

// Instanciação preguiçosa: não quebra o boot se a chave ainda não estiver
// configurada; só falha quando a loja realmente tenta cobrar.
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY não configurada");
  }
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

export interface ItemPedido {
  nome: string;
  quantidade: number;
  preco: number;
  tamanho?: string | null;
}

// Cria a sessão de checkout do Stripe para um pedido da loja.
export async function criarSessaoPedidoLoja(params: {
  orderId: string;
  userEmail: string;
  itens: ItemPedido[];
  baseUrl: string;
}) {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.userEmail,
    line_items: params.itens.map((i) => ({
      price_data: {
        currency: "brl",
        product_data: { name: i.tamanho ? `${i.nome} (Tam ${i.tamanho})` : i.nome },
        unit_amount: Math.round(i.preco * 100),
      },
      quantity: i.quantidade,
    })),
    success_url: `${params.baseUrl}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.baseUrl}/checkout/cancelado`,
    metadata: { orderId: params.orderId, tipo: "pedido_loja" },
  });
}

// Aprova um pedido a partir de uma sessão do Stripe (idempotente). Consulta a
// sessão na API do Stripe — não confia em dados vindos do cliente.
export async function aprovarPedidoStripe(sessionId: string): Promise<{ approved: boolean }> {
  const stripe = getStripe();
  const sessao = await stripe.checkout.sessions.retrieve(sessionId);
  if (sessao.payment_status !== "paid") return { approved: false };

  const orderId = sessao.metadata?.orderId;
  if (!orderId) return { approved: false };

  const upd = await prisma.order.updateMany({
    where: { id: orderId, status: { not: "APPROVED" } },
    data: { status: "APPROVED", paymentId: `stripe:${sessao.id}` },
  });

  if (upd.count > 0) {
    await audit({
      actorType: "WEBHOOK",
      action: "ORDER_APPROVED",
      entityId: orderId,
      entityType: "Order",
      metadata: { sessionId: sessao.id, via: "stripe" },
    });

    // E-mail de confirmação do pedido — só nesta transição (idempotente).
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        total: true,
        user: { select: { name: true, email: true } },
        items: {
          select: {
            quantity: true,
            size: true,
            price: true,
            product: { select: { name: true } },
          },
        },
      },
    });
    if (order) {
      try {
        await sendOrderConfirmationEmail(
          order.user.email,
          order.user.name,
          order.items.map((it) => ({
            name: it.product.name,
            quantity: it.quantity,
            size: it.size,
            price: Number(it.price),
          })),
          Number(order.total)
        );
      } catch (err) {
        logger.error("sendOrderConfirmationEmail (stripe)", err);
      }
    }
  }

  return { approved: true };
}

// Devolve o estoque de um pedido cuja sessão do Stripe expirou/cancelou.
export async function cancelarPedidoStripe(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
    // Só devolve estoque se o pedido ainda não foi aprovado.
    if (!order || order.status === "APPROVED") return;

    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    const itens = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of itens) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}
