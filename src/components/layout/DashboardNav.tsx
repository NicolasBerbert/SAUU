"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/minhas-palestras", label: "Minhas Palestras" },
  { href: "/inscricao", label: "Selecionar Palestras" },
  { href: "/loja", label: "Loja" },
];

export function DashboardNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-5 w-px bg-accent" />
            <span className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors">
              SAUU
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs uppercase tracking-widest transition-colors",
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
            <span className="text-xs text-muted hidden sm:block truncate max-w-32">
              {userName}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden gap-4 pb-3 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-xs uppercase tracking-widest whitespace-nowrap transition-colors",
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
