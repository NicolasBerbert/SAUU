import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { sendOrderConfirmationEmail } from "@/lib/email";

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

// Cria um pagamento PIX direto (API de Pagamentos / checkout transparente) e
// devolve a URL do "ticket" do Mercado Pago — uma página pública com o QR e o
// copia-e-cola, que QUALQUER pessoa paga de QUALQUER banco, sem login no MP e
// sem usar saldo Mercado Pago.
export async function criarPagamentoPix(params: {
  amount: number;
  description: string;
  payerEmail: string;
  payerFirstName: string;
  payerCpf?: string | null;
  ref: PagamentoRef;
  baseUrl: string;
}): Promise<{ id: number; ticketUrl: string; qrCode: string; qrCodeBase64: string }> {
  if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada");

  const payer: Record<string, unknown> = {
    email: params.payerEmail,
    first_name: params.payerFirstName,
  };
  if (params.payerCpf) {
    payer.identification = { type: "CPF", number: params.payerCpf.replace(/\D/g, "") };
  }

  const body = {
    transaction_amount: Number(params.amount.toFixed(2)),
    description: params.description,
    payment_method_id: "pix",
    external_reference: encodeRef(params.ref),
    notification_url: `${params.baseUrl}/api/pagamento/mercadopago/webhook`,
    payer,
  };

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json",
      // Chave de idempotência única por tentativa de pagamento.
      "X-Idempotency-Key": `${params.ref.tipo}-${params.ref.orderId ?? params.ref.userId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Mercado Pago payment error ${res.status}: ${txt}`);
  }

  const data = (await res.json()) as {
    id: number;
    point_of_interaction?: {
      transaction_data?: { ticket_url?: string; qr_code?: string; qr_code_base64?: string };
    };
  };
  const tx = data.point_of_interaction?.transaction_data ?? {};
  return {
    id: data.id,
    ticketUrl: tx.ticket_url ?? "",
    qrCode: tx.qr_code ?? "",
    qrCodeBase64: tx.qr_code_base64 ?? "",
  };
}

export interface MpPayment {
  id: number;
  status: string; // approved | pending | in_process | rejected | cancelled | refunded
  external_reference: string | null;
  transaction_amount: number;
  point_of_interaction?: {
    transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
  };
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

      // E-mail de confirmação do pedido da loja. Só é enviado nesta transição
      // (upd.count > 0), então notificação duplicada do MP não reenvia.
      const order = await prisma.order.findUnique({
        where: { id: ref.orderId },
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
          logger.error("sendOrderConfirmationEmail", err);
        }
      }
    }
  }

  return { approved: true };
}
