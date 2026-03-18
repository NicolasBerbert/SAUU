import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendAdminAlert } from "@/lib/alert";

export const dynamic = "force-dynamic";

// Thresholds de anomalia — ajustar conforme o tráfego do evento
const THRESHOLDS = {
  falhasLoginUltimaHora: 20,          // tentativas de login bloqueadas por rate limit
  webhooksInvalidosUltimaHora: 5,     // assinaturas inválidas no webhook MP
  checkoutsRejeitadosUltimaHora: 10,  // pagamentos rejeitados/cancelados
  pedidosPendentesAntigos: 15,        // pedidos PENDING há mais de 2h (estoque preso)
};

interface ResumoSeguranca {
  status: "ok" | "alerta" | "critico";
  anomalias: string[];
  metricas: Record<string, number>;
  verificadoEm: string;
}

// GET /api/admin/monitorar
// Analisa o AuditLog e as tabelas em busca de padrões anômalos.
// Pode ser chamado pelo UptimeRobot ou pelo admin.
// Se encontrar anomalias, envia email e retorna status de alerta.
// Aceita autenticação admin via sessão OU token de serviço.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const serviceToken = req.headers.get("x-service-token");
  const isAdmin = session?.user?.type === "ADMIN";
  const isServiceCall = serviceToken && serviceToken === process.env.CLEANUP_SERVICE_TOKEN;

  if (!isAdmin && !isServiceCall) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const agora = new Date();
    const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000);
    const duasHorasAtras = new Date(agora.getTime() - 2 * 60 * 60 * 1000);

    // ── 1. Tentativas de brute force / rate limit no login ────────────────
    const falhasLogin = await prisma.auditLog.count({
      where: {
        action: { in: ["LOGIN_RATE_LIMITED", "LOGIN_FAILED"] },
        createdAt: { gte: umaHoraAtras },
      },
    });

    // ── 2. Probing do webhook — assinaturas inválidas ─────────────────────
    // Registrado via logger.warn mas não ainda no AuditLog.
    // Contamos CHECKOUT_COMBINED + REGISTRATION + ORDER com status de alerta
    const webhooksInvalidos = await prisma.auditLog.count({
      where: {
        action: "WEBHOOK_SIGNATURE_INVALID",
        createdAt: { gte: umaHoraAtras },
      },
    });

    // ── 3. Pagamentos rejeitados / cancelados em massa ────────────────────
    const pagamentosRejeitados = await prisma.auditLog.count({
      where: {
        action: { in: [
          "REGISTRATION_PAYMENT_REJECTED",
          "REGISTRATION_PAYMENT_CANCELLED",
          "ORDER_REJECTED",
          "ORDER_CANCELLED",
          "CHECKOUT_COMBINED_REJECTED",
          "CHECKOUT_COMBINED_CANCELLED",
        ]},
        createdAt: { gte: umaHoraAtras },
      },
    });

    // ── 4. Pedidos PENDING antigos (estoque preso) ─────────────────────────
    const pedidosPendentesAntigos = await prisma.order.count({
      where: {
        status: "PENDING",
        createdAt: { lt: duasHorasAtras },
      },
    });

    // ── 5. Saúde do banco ─────────────────────────────────────────────────
    const inicioBanco = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latenciaBanco = Date.now() - inicioBanco;

    // ── 6. Pico de erros críticos no AuditLog ────────────────────────────
    const errosCriticos = await prisma.auditLog.count({
      where: {
        action: { startsWith: "ERROR_" },
        createdAt: { gte: umaHoraAtras },
      },
    });

    // ── Avalia anomalias ───────────────────────────────────────────────────
    const anomalias: string[] = [];

    if (falhasLogin >= THRESHOLDS.falhasLoginUltimaHora) {
      anomalias.push(`Brute force detectado: ${falhasLogin} tentativas de login bloqueadas na última hora`);
    }
    if (webhooksInvalidos >= THRESHOLDS.webhooksInvalidosUltimaHora) {
      anomalias.push(`Probing de webhook: ${webhooksInvalidos} assinaturas inválidas na última hora`);
    }
    if (pagamentosRejeitados >= THRESHOLDS.checkoutsRejeitadosUltimaHora) {
      anomalias.push(`Pico de rejeições: ${pagamentosRejeitados} pagamentos rejeitados/cancelados na última hora`);
    }
    if (pedidosPendentesAntigos >= THRESHOLDS.pedidosPendentesAntigos) {
      anomalias.push(`Estoque preso: ${pedidosPendentesAntigos} pedidos PENDING há mais de 2h sem pagamento`);
    }
    if (latenciaBanco > 2000) {
      anomalias.push(`Banco lento: ${latenciaBanco}ms de latência (esperado < 500ms)`);
    }

    const metricas = {
      falhasLoginUltimaHora: falhasLogin,
      webhooksInvalidosUltimaHora: webhooksInvalidos,
      pagamentosRejeitadosUltimaHora: pagamentosRejeitados,
      pedidosPendentesAntigos,
      latenciaBancoMs: latenciaBanco,
      errosCriticosUltimaHora: errosCriticos,
    };

    const status: ResumoSeguranca["status"] =
      anomalias.length === 0 ? "ok"
      : anomalias.length <= 2 ? "alerta"
      : "critico";

    // Envia alerta por email se houver anomalias
    if (anomalias.length > 0) {
      const severidade = status === "critico" ? "CRITICO" : "AVISO";
      const linhasMetricas = Object.entries(metricas)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join("\n");

      await sendAdminAlert(
        `Anomalias detectadas no monitoramento (${anomalias.length})`,
        `ANOMALIAS:\n${anomalias.map((a) => `• ${a}`).join("\n")}\n\nMÉTRICAS:\n${linhasMetricas}`,
        severidade
      );
    }

    const resumo: ResumoSeguranca = {
      status,
      anomalias,
      metricas,
      verificadoEm: agora.toISOString(),
    };

    logger.info("monitorar", { status, anomalias: anomalias.length });

    return NextResponse.json(resumo, {
      status: status === "ok" ? 200 : status === "alerta" ? 200 : 503,
    });
  } catch (error) {
    logger.error("GET /api/admin/monitorar", error);
    return NextResponse.json({ error: "Erro no monitoramento" }, { status: 500 });
  }
}
