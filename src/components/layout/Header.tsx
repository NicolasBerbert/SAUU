"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-8 w-px bg-accent" />
            <div>
              <span className="text-sm font-semibold tracking-widest text-primary uppercase">
                SAUU
              </span>
              <span className="ml-2 text-xs text-muted tracking-wider hidden sm:inline">
                Semana de Arquitetura Unifil
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-6">
            <Link
              href="/programacao"
              className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors"
            >
              Programação
            </Link>
            <Link
              href="/loja"
              className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors"
            >
              Loja
            </Link>

            {session ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/minhas-palestras"
                  className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors"
                >
                  Minhas Palestras
                </Link>
                <Button
                  variant="ghost"
                  className="text-xs uppercase tracking-widest"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-xs uppercase tracking-widest">
                    Entrar
                  </Button>
                </Link>
                <Link href="/cadastro">
                  <Button variant="primary" className="text-xs uppercase tracking-widest">
                    Inscrever-se
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
