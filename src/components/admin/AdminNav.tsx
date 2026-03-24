"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/checkin", label: "Check-in" },
  { href: "/admin/presenca", label: "Presença" },
  { href: "/admin/horas", label: "Horas" },
  { href: "/admin/palestras", label: "Palestras" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/loja", label: "Loja" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/configurar-2fa", label: "2FA" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-6 w-px bg-accent" />
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">SAUU</span>
        </Link>
        <p className="text-[10px] text-muted mt-1 ml-3 tracking-wider">Admin</p>
      </div>

      <nav className="flex flex-col gap-px p-3 flex-1">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 text-xs uppercase tracking-widest transition-colors",
                active
                  ? "text-primary bg-surface-2"
                  : "text-muted hover:text-primary hover:bg-surface"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full px-3 py-2 text-xs uppercase tracking-widest text-muted hover:text-danger transition-colors text-left"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
