import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export const mpPayment = new Payment(client);
export const mpPreference = new Preference(client);

// ─────────────────────────────────────────────
// Inscrição no evento
// ─────────────────────────────────────────────

export async function createEventRegistrationPreference(params: {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
}) {
  const preference = await mpPreference.create({
    body: {
      items: [
        {
          id: "inscricao-sauu",
          title: "Inscrição - SAUU Unifil",
          quantity: 1,
          unit_price: params.amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        name: params.userName,
        email: params.userEmail,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancelado`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/pendente`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/pagamento/webhook`,
      metadata: {
        userId: params.userId,
        type: "event_registration",
      },
    },
  });

  return preference;
}

// ─────────────────────────────────────────────
// Loja
// ─────────────────────────────────────────────

export async function createShopOrderPreference(params: {
  userId: string;
  userName: string;
  userEmail: string;
  orderId: string;
  items: Array<{ id: string; title: string; quantity: number; unit_price: number }>;
  total: number;
}) {
  const preference = await mpPreference.create({
    body: {
      items: params.items.map((item) => ({
        ...item,
        currency_id: "BRL",
      })),
      payer: {
        name: params.userName,
        email: params.userEmail,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/loja/pedido/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/loja/pedido/cancelado`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/loja/pedido/pendente`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/pagamento/webhook`,
      metadata: {
        userId: params.userId,
        orderId: params.orderId,
        type: "shop_order",
      },
    },
  });

  return preference;
}
