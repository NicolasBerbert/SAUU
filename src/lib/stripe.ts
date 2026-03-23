import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const baseUrl = () => process.env.NEXT_PUBLIC_BASE_URL!;

// Inscrição no evento
export async function criarSessaoInscricao(params: {
  userId: string;
  userEmail: string;
  amount: number;
}) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.userEmail,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: { name: "Inscrição — SAUU Unifil" },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl()}/checkout/sucesso`,
    cancel_url: `${baseUrl()}/checkout/cancelado`,
    metadata: {
      userId: params.userId,
      tipo: "inscricao",
    },
  });
}

// Pedido da loja
export async function criarSessaoPedidoLoja(params: {
  userId: string;
  userEmail: string;
  orderId: string;
  itens: Array<{ nome: string; quantidade: number; preco: number }>;
}) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.userEmail,
    line_items: params.itens.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: { name: item.nome },
        unit_amount: Math.round(item.preco * 100),
      },
      quantity: item.quantidade,
    })),
    success_url: `${baseUrl()}/loja/pedido/sucesso`,
    cancel_url: `${baseUrl()}/loja/pedido/cancelado`,
    metadata: {
      userId: params.userId,
      tipo: "pedido_loja",
      orderId: params.orderId,
    },
  });
}
