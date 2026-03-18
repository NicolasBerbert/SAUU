import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { LimparPendentesButton } from "@/components/admin/LimparPendentesButton";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") redirect("/login");

  const agora = new Date();
  const duasHorasAtras = new Date(agora.getTime() - 2 * 60 * 60 * 1000);
  const ultimas24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

  const [
    inscricoesStats,
    pedidosStats,
    produtosBaixoEstoque,
    pedidosPendentesAntigos,
    ultimasAcoes,
    receitaInscricoes,
    receitaPedidos,
    cadastrosHoje,
  ] = await Promise.all([
    // Inscrições por status
    prisma.eventRegistration.groupBy({
      by: ["paymentStatus"],
      _count: { _all: true },
    }),
    // Pedidos por status
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    // Produtos com estoque baixo (≤ 5)
    prisma.product.findMany({
      where: { active: true, stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      select: { id: true, name: true, stock: true },
    }),
    // Pedidos PENDING há mais de 2h (estoque preso)
    prisma.order.count({
      where: { status: "PENDING", createdAt: { lt: duasHorasAtras } },
    }),
    // Últimas 15 ações do AuditLog
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        actorType: true,
        action: true,
        entityType: true,
        createdAt: true,
        metadata: true,
      },
    }),
    // Receita total de inscrições aprovadas
    prisma.eventRegistration.aggregate({
      where: { paymentStatus: "APPROVED" },
      _sum: { amount: true },
    }),
    // Receita total de pedidos aprovados
    prisma.order.aggregate({
      where: { status: "APPROVED" },
      _sum: { total: true },
    }),
    // Novos cadastros nas últimas 24h
    prisma.user.count({
      where: { type: { not: "ADMIN" }, createdAt: { gte: ultimas24h } },
    }),
  ]);

  const receitaTotal =
    (receitaInscricoes._sum.amount?.toNumber() ?? 0) +
    (receitaPedidos._sum.total?.toNumber() ?? 0);

  const statusLabel: Record<string, string> = {
    APPROVED: "Aprovado",
    PENDING: "Pendente",
    REJECTED: "Rejeitado",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Relatórios</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-1">Relatórios</h1>
      <p className="text-sm text-muted mb-10">
        Atualizado em tempo real · {agora.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
      </p>

      {/* Receita */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-widest text-muted mb-3">Receita</h2>
        <div className="grid grid-cols-3 gap-px bg-border">
          <div className="bg-surface p-6">
            <p className="text-2xl font-light text-accent mb-1">{formatCurrency(receitaTotal)}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">Total geral</p>
          </div>
          <div className="bg-surface p-6">
            <p className="text-2xl font-light text-accent mb-1">
              {formatCurrency(receitaInscricoes._sum.amount?.toNumber() ?? 0)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted">Inscrições</p>
          </div>
          <div className="bg-surface p-6">
            <p className="text-2xl font-light text-accent mb-1">
              {formatCurrency(receitaPedidos._sum.total?.toNumber() ?? 0)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted">Loja</p>
          </div>
        </div>
      </section>

      {/* Inscrições e Pedidos lado a lado */}
      <section className="mb-8 grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted mb-3">Inscrições no evento</h2>
          <div className="border border-border divide-y divide-border">
            {inscricoesStats.length === 0 && (
              <p className="px-4 py-3 text-xs text-muted">Nenhuma inscrição ainda.</p>
            )}
            {inscricoesStats.map((row) => (
              <div key={row.paymentStatus} className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-muted">{statusLabel[row.paymentStatus] ?? row.paymentStatus}</span>
                <span className="text-sm text-primary">{row._count._all}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted mb-3">Pedidos da loja</h2>
          <div className="border border-border divide-y divide-border">
            {pedidosStats.length === 0 && (
              <p className="px-4 py-3 text-xs text-muted">Nenhum pedido ainda.</p>
            )}
            {pedidosStats.map((row) => (
              <div key={row.status} className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-muted">{statusLabel[row.status] ?? row.status}</span>
                <span className="text-sm text-primary">{row._count._all}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alertas */}
      {(pedidosPendentesAntigos > 0 || produtosBaixoEstoque.length > 0 || cadastrosHoje > 10) && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-3">Alertas</h2>
          <div className="border border-border divide-y divide-border">
            {pedidosPendentesAntigos > 0 && (
              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-danger mb-0.5">
                    {pedidosPendentesAntigos} {pedidosPendentesAntigos === 1 ? "pedido PENDING há" : "pedidos PENDING há"} mais de 2h
                  </p>
                  <p className="text-[10px] text-muted">Estoque reservado e preso. Use o botão abaixo para liberar.</p>
                </div>
                <LimparPendentesButton />
              </div>
            )}
            {produtosBaixoEstoque.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-primary">{p.name}</p>
                <span className={`text-xs ${p.stock === 0 ? "text-danger" : "text-accent"}`}>
                  {p.stock === 0 ? "Esgotado" : `${p.stock} restantes`}
                </span>
              </div>
            ))}
            {cadastrosHoje > 10 && (
              <div className="px-4 py-3">
                <p className="text-xs text-accent">{cadastrosHoje} novos cadastros nas últimas 24h</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Estoque */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-widest text-muted mb-3">Novos cadastros (24h)</h2>
        <div className="border border-border px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-muted">Usuários cadastrados nas últimas 24 horas</span>
          <span className="text-sm text-primary">{cadastrosHoje}</span>
        </div>
      </section>

      {/* Últimas ações do AuditLog */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted mb-3">Últimas ações (AuditLog)</h2>
        <div className="border border-border divide-y divide-border">
          {ultimasAcoes.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary font-mono truncate">{log.action}</p>
                <p className="text-[10px] text-muted">
                  {log.actorType} · {log.entityType ?? "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted shrink-0">
                {new Date(log.createdAt).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
