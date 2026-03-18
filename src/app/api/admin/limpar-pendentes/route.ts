import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Limiar: pedidos PENDING há mais de 2 horas são considerados abandonados
const LIMIAR_HORAS = 2;

// POST /api/admin/limpar-pendentes
// Cancela pedidos PENDING abandonados e devolve o estoque reservado.
// Pode ser chamado pelo PM2 cron, UptimeRobot, ou manualmente pelo admin.
// Também cancela EventRegistrations PENDING antigas (sem estoque a devolver).
export async function POST(req: NextRequest) {
  // Aceita autenticação admin via sessão OU via token de serviço interno
  const session = await getServerSession(authOptions);
  const serviceToken = req.headers.get("x-service-token");
  const isAdmin = session?.user?.type === "ADMIN";
  const isServiceCall = serviceToken && serviceToken === process.env.CLEANUP_SERVICE_TOKEN;

  if (!isAdmin && !isServiceCall) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const limiar = new Date(Date.now() - LIMIAR_HORAS * 60 * 60 * 1000);

  try {
    // 1. Buscar pedidos PENDING expirados com seus itens
    const pedidosExpirados = await prisma.order.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: limiar },
      },
      include: {
        items: { select: { productId: true, quantity: true } },
      },
    });

    let pedidosCancelados = 0;

    // 2. Para cada pedido, devolver estoque e cancelar em transação atômica
    for (const pedido of pedidosExpirados) {
      await prisma.$transaction(async (tx) => {
        // Devolver estoque de cada item
        for (const item of pedido.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Cancelar o pedido
        await tx.order.update({
          where: { id: pedido.id },
          data: { status: "CANCELLED" },
        });
      });

      await audit({
        actorType: "SYSTEM",
        action: "ORDER_CANCELLED_STALE",
        entityId: pedido.id,
        entityType: "Order",
        metadata: {
          userId: pedido.userId,
          total: Number(pedido.total),
          idadeHoras: Math.round((Date.now() - pedido.createdAt.getTime()) / 3600000),
          itemCount: pedido.items.length,
        },
      });

      pedidosCancelados++;
    }

    // 3. Cancelar EventRegistrations PENDING expiradas (sem estoque a devolver)
    const registracoesExpiradas = await prisma.eventRegistration.updateMany({
      where: {
        paymentStatus: "PENDING",
        createdAt: { lt: limiar },
      },
      data: { paymentStatus: "CANCELLED" },
    });

    logger.info("limpar-pendentes", {
      pedidosCancelados,
      registracoesExpiradas: registracoesExpiradas.count,
      limiarHoras: LIMIAR_HORAS,
    });

    return NextResponse.json({
      ok: true,
      pedidosCancelados,
      registracoesExpiradas: registracoesExpiradas.count,
    });
  } catch (error) {
    logger.error("POST /api/admin/limpar-pendentes", error);
    return NextResponse.json({ error: "Erro ao limpar pedidos pendentes" }, { status: 500 });
  }
}
