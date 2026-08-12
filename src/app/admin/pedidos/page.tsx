import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { ExportButton } from "@/components/admin/ExportButton";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  APPROVED: "Aprovado",
  PENDING: "Pendente",
  REJECTED: "Recusado",
};

const statusColor: Record<string, string> = {
  APPROVED: "text-success",
  PENDING: "text-accent",
  REJECTED: "text-danger",
};

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true, type: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = orders
    .filter((o) => o.status === "APPROVED")
    .reduce((sum, o) => sum + o.total.toNumber(), 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <div className="flex items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-light text-primary mb-2">Pedidos</h1>
          <p className="text-sm text-muted">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} · {formatCurrency(totalRevenue)} aprovados
          </p>
        </div>
        <ExportButton href="/api/admin/exportar/pedidos" label="Exportar planilha" />
      </div>

      <div className="border border-border">
        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-surface">
          <p className="col-span-3 text-[10px] uppercase tracking-widest text-muted">Comprador</p>
          <p className="col-span-4 text-[10px] uppercase tracking-widest text-muted">Produtos</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Total</p>
          <p className="col-span-1 text-[10px] uppercase tracking-widest text-muted">Status</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted text-right">Data</p>
        </div>

        <div className="flex flex-col gap-px bg-border">
          {orders.length === 0 && (
            <div className="bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted">Nenhum pedido ainda.</p>
            </div>
          )}
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-surface px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center"
            >
              <div className="sm:col-span-3 min-w-0">
                <p className="text-sm text-primary truncate">{order.user.name}</p>
                <p className="text-xs text-muted truncate">{order.user.email}</p>
              </div>
              <div className="sm:col-span-4 min-w-0">
                {order.items.map((item) => (
                  <p key={item.id} className="text-xs text-muted truncate">
                    {item.quantity}× {item.product.name}
                    {item.size && (
                      <span className="ml-1 uppercase text-primary">· Tam {item.size}</span>
                    )}
                  </p>
                ))}
              </div>
              <p className="sm:col-span-2 text-sm text-accent">{formatCurrency(order.total.toNumber())}</p>
              <p className={`sm:col-span-1 text-xs ${statusColor[order.status] ?? "text-muted"}`}>
                {statusLabel[order.status] ?? order.status}
              </p>
              <p className="sm:col-span-2 text-xs text-muted sm:text-right">
                {new Date(order.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
