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
      {/* Header */}
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3.5">
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
          <span className="eyebrow">Admin</span>
        </div>
        <h1 className="mb-1 font-display text-[48px] leading-none text-primary">
          Painel
        </h1>
        <p className="text-[14px] text-muted">Visão geral do evento.</p>
      </div>

      {/* Metrics */}
      <div
        className="mb-10 grid grid-cols-2 gap-px sm:grid-cols-3"
        style={{ background: "var(--line)", border: "1px solid var(--line)" }}
      >
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="group flex flex-col gap-2 p-6 transition-colors"
            style={{ background: "var(--paper)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "var(--bg)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "var(--paper)")
            }
          >
            <span
              className="font-display text-[36px] leading-none"
              style={{ color: "var(--red)" }}
            >
              {m.value}
            </span>
            <span
              className="text-[11px] uppercase tracking-[0.22em] transition-colors group-hover:text-primary"
              style={{ color: "var(--muted)" }}
            >
              {m.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick access */}
      <div style={{ border: "1px solid var(--line)" }}>
        <div
          className="border-b px-6 py-4"
          style={{ borderColor: "var(--line)", background: "var(--paper)" }}
        >
          <p
            className="text-[11px] uppercase tracking-[0.28em]"
            style={{ color: "var(--muted)" }}
          >
            Acesso rápido
          </p>
        </div>
        <div
          className="flex flex-col gap-px"
          style={{ background: "var(--line)" }}
        >
          {[
            { href: "/admin/palestras", label: "Gerenciar palestras", desc: "Adicionar, editar e remover palestras" },
            { href: "/admin/presenca", label: "Lista de presença", desc: "Registrar presença por palestra" },
            { href: "/admin/loja", label: "Gerenciar loja", desc: "Adicionar e gerenciar produtos" },
            { href: "/admin/usuarios", label: "Ver usuários", desc: "Lista de participantes cadastrados" },
            { href: "/admin/pedidos", label: "Ver pedidos", desc: "Pedidos da loja e retiradas" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between px-6 py-4 transition-colors"
              style={{ background: "var(--paper)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = "var(--bg)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = "var(--paper)")
              }
            >
              <div>
                <p className="mb-0.5 text-[14px] text-primary">{item.label}</p>
                <p className="text-[12px] text-muted">{item.desc}</p>
              </div>
              <span
                className="ml-4 shrink-0 text-[18px] transition-transform group-hover:translate-x-1"
                style={{ color: "var(--muted)" }}
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
