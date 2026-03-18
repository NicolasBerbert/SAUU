import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [totalUsers, totalRegistrations, totalOrders, totalProducts, totalPresentations] =
    await Promise.all([
      prisma.user.count({ where: { type: { not: "ADMIN" } } }),
      prisma.eventRegistration.count({ where: { paymentStatus: "APPROVED" } }),
      prisma.order.count({ where: { status: "APPROVED" } }),
      prisma.product.count({ where: { active: true } }),
      prisma.presentation.count({ where: { active: true } }),
    ]);

  const metrics = [
    { label: "Usuários cadastrados", value: totalUsers, href: "/admin/usuarios" },
    { label: "Inscrições pagas", value: totalRegistrations, href: "/admin/usuarios" },
    { label: "Palestras ativas", value: totalPresentations, href: "/admin/palestras" },
    { label: "Produtos na loja", value: totalProducts, href: "/admin/loja" },
    { label: "Pedidos aprovados", value: totalOrders, href: "/admin/pedidos" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>

      <h1 className="text-3xl font-light text-primary mb-2">Painel Administrativo</h1>
      <p className="text-sm text-muted mb-10">Visão geral do evento.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border mb-10">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="bg-surface p-6 hover:bg-surface-2 transition-colors group"
          >
            <p className="text-3xl font-light text-accent mb-2">{m.value}</p>
            <p className="text-xs uppercase tracking-widest text-muted group-hover:text-primary transition-colors">
              {m.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="border border-border">
        <div className="px-6 py-4 border-b border-border bg-surface">
          <p className="text-xs uppercase tracking-widest text-muted">Acesso rápido</p>
        </div>
        <div className="flex flex-col gap-px bg-border">
          {[
            { href: "/admin/palestras", label: "Gerenciar palestras", desc: "Adicionar, editar e remover palestras" },
            { href: "/admin/loja", label: "Gerenciar loja", desc: "Adicionar e gerenciar produtos" },
            { href: "/admin/usuarios", label: "Ver usuários", desc: "Lista de participantes cadastrados" },
            { href: "/admin/pedidos", label: "Ver pedidos", desc: "Pedidos da loja e retiradas" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-surface px-6 py-4 flex items-center justify-between hover:bg-surface-2 transition-colors group"
            >
              <div>
                <p className="text-sm text-primary mb-0.5">{item.label}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
              <svg className="h-4 w-4 text-muted group-hover:text-accent transition-colors shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
