import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, aprovarPedidoStripe, cancelarPedidoStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

// POST /api/pagamento/webhook — webhook do Stripe (pedidos da loja).
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.warn("stripe webhook", `Assinatura inválida: ${err}`);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await aprovarPedidoStripe(session.id);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) await cancelarPedidoStripe(orderId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("stripe webhook", error);
    return NextResponse.json({ error: "Erro no webhook" }, { status: 500 });
  }
}
