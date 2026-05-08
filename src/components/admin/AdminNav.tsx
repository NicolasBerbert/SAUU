"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/presenca", label: "Presença" },
  { href: "/admin/horas", label: "Horas" },
  { href: "/admin/palestras", label: "Palestras" },
  { href: "/admin/palestrantes", label: "Palestrantes" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/loja", label: "Loja" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-56 shrink-0 flex-col border-r"
      style={{ borderColor: "var(--line)", background: "var(--paper)", minHeight: "100vh" }}
    >
      <div className="border-b px-6 py-5" style={{ borderColor: "var(--line)" }}>
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className="grid h-7 w-7 place-items-center rounded-full font-display text-xs text-background"
            style={{ background: "var(--red)" }}
          >
            C
          </span>
          <span className="font-display text-base font-normal" style={{ color: "var(--red)" }}>
            CLBB
          </span>
        </Link>
        <p className="ml-[38px] mt-0.5 text-[10px] uppercase tracking-wider text-muted">
          Admin
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-px p-3">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "border-l-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors",
                active
                  ? "border-accent bg-background text-accent"
                  : "border-transparent text-muted hover:bg-background hover:text-primary"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3" style={{ borderColor: "var(--line)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full px-3 py-2 text-left text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-danger"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
