"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Início" },
  { href: "/programacao", label: "Programação" },
  { href: "/loja", label: "Loja" },
  { href: "/minhas-palestras", label: "Minhas Palestras" },
  { href: "/inscricao", label: "Inscrição" },
];

export function DashboardNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header
      className="border-b"
      style={{ borderColor: "var(--line-soft)", background: "var(--paper)" }}
    >
      <div className="mx-auto max-w-[1320px] px-8">
        <div className="flex h-[70px] items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-3">
            <span
              className="grid h-[34px] w-[34px] place-items-center rounded-full font-display text-sm text-background transition-transform duration-300 group-hover:-rotate-[8deg]"
              style={{ background: "var(--red)" }}
            >
              C
            </span>
            <b
              className="font-display text-lg font-normal"
              style={{ color: "var(--red)" }}
            >
              CLBB
            </b>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-6 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[12px] uppercase tracking-[0.18em] transition-colors",
                  pathname === link.href
                    ? "text-accent"
                    : "text-muted hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center gap-4">
            <span className="hidden max-w-[130px] truncate text-[12px] text-muted sm:block">
              {userName}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-[12px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex gap-4 overflow-x-auto pb-3 sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap text-[12px] uppercase tracking-[0.18em] transition-colors",
                pathname === link.href
                  ? "text-accent"
                  : "text-muted hover:text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
