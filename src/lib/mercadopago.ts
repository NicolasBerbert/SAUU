import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

// ─────────────────────────────────────────────────────────────
// Integração Mercado Pago — pagamentos via PIX (Checkout Pro).
// Substitui o Stripe. A confirmação do pagamento é SEMPRE verificada
// consultando a API do Mercado Pago com o nosso access token — nunca
// confiamos apenas no corpo do webhook.
// ─────────────────────────────────────────────────────────────

const MP_API = "https://api.mercadopago.com";
const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export interface PagamentoRef {
  userId: string;
  tipo: "inscricao" | "pedido_loja" | "combinado";
  orderId?: string | null;
  incluirInscricao?: boolean;
}

// Guardamos o contexto no external_reference (string que o MP devolve
// intacta), evitando a conversão de chaves que o MP faz em metadata.
export function encodeRef(ref: PagamentoRef): string {
  return Buffer.from(JSON.stringify(ref)).toString("base64url");
}

export function decodeRef(value: string | null | undefined): PagamentoRef | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (parsed && typeof parsed.userId === "string" && typeof parsed.tipo === "string") {
      return parsed as PagamentoRef;
    }
    return null;
  } catch {
    return null;
  }
}

interface ItemPreferencia {
  title: string;
  quantity: number;
  unitPrice: number;
}

// Cria uma preferência de checkout restrita a PIX e devolve a URL de pagamento.
export async function criarPreferenciaPix(params: {
  items: ItemPreferencia[];
  payerEmail: string;
  ref: PagamentoRef;
  baseUrl: string;
}): Promise<{ id: string; initPoint: string }> {
  if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada");

  const body = {
    items: params.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      unit_price: Number(i.unitPrice.toFixed(2)),
      currency_id: "BRL",
    })),
    payer: { email: params.payerEmail },
    external_reference: encodeRef(params.ref),
    // Só PIX: exclui cartão, boleto, saldo em conta etc.
    payment_methods: {
      excluded_payment_types: [
        { id: "credit_card" },
        { id: "debit_card" },
        { id: "ticket" },
        { id: "atm" },
        { id: "prepaid_card" },
        { id: "account_money" },
      ],
      installments: 1,
    },
    back_urls: {
      success: `${params.baseUrl}/checkout/sucesso`,
      failure: `${params.baseUrl}/checkout/cancelado`,
      pending: `${params.baseUrl}/checkout/sucesso`,
    },
    auto_return: "approved",
    notification_url: `${params.baseUrl}/api/pagamento/mercadopago/webhook`,
    statement_descriptor: "SAUU CLBB",
  };

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Mercado Pago preference error ${res.status}: ${txt}`);
  }

  const data = (await res.json()) as { id: string; init_point: string };
  return { id: data.id, initPoint: data.init_point };
}

export interface MpPayment {
  id: number;
  status: string; // approved | pending | in_process | rejected | cancelled | refunded
  external_reference: string | null;
  transaction_amount: number;
}

// Emite reembolso total de um pagamento (paymentId é o id numérico do MP).
export async function reembolsarPagamento(paymentId: string): Promise<{ id: number }> {
  if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada");
  const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `refund-${paymentId}`,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Mercado Pago refund error ${res.status}: ${txt}`);
  }
  return (await res.json()) as { id: number };
}

// Consulta autoritativa do pagamento (autenticada com o nosso token).
export async function buscarPagamento(paymentId: string): Promise<MpPayment | null> {
  if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada");
  const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Mercado Pago payment fetch error ${res.status}`);
  return (await res.json()) as MpPayment;
}

// Processa um pagamento: consulta o MP e, se aprovado, libera a inscrição
// e/ou o pedido. Idempotente (só atualiza o que ainda não está APPROVED),
// então webhook duplicado + retorno da tela de sucesso não causam problema.
export async function processarPagamentoMp(paymentId: string): Promise<{ approved: boolean }> {
  const pagamento = await buscarPagamento(paymentId);
  if (!pagamento || pagamento.status !== "approved") {
    return { approved: false };
  }

  const ref = decodeRef(pagamento.external_reference);
  if (!ref?.userId) {
    logger.warn("mercadopago", "Pagamento aprovado sem external_reference válido");
    return { approved: false };
  }

  const paymentIdStr = `mp:${pagamento.id}`;
  const aprovaInscricao = ref.tipo === "inscricao" || ref.incluirInscricao === true;

  if (aprovaInscricao) {
    const upd = await prisma.eventRegistration.updateMany({
      where: { userId: ref.userId, paymentStatus: { not: "APPROVED" } },
      data: { paymentStatus: "APPROVED", paymentId: paymentIdStr },
    });
    if (upd.count > 0) {
      await audit({
        actorType: "WEBHOOK",
        action: "REGISTRATION_PAYMENT_APPROVED",
        entityId: ref.userId,
        entityType: "EventRegistration",
        metadata: { paymentId: pagamento.id, via: "mercadopago" },
      });
    }
  }

  if (ref.orderId) {
    const upd = await prisma.order.updateMany({
      where: { id: ref.orderId, status: { not: "APPROVED" } },
      data: { status: "APPROVED", paymentId: paymentIdStr },
    });
    if (upd.count > 0) {
      await audit({
        actorType: "WEBHOOK",
        action: "ORDER_APPROVED",
        entityId: ref.orderId,
        entityType: "Order",
        metadata: { paymentId: pagamento.id, via: "mercadopago" },
      });
    }
  }

  return { approved: true };
}
