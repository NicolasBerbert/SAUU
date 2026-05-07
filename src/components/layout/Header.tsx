"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export function Header({ showLoja = true }: { showLoja?: boolean }) {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b transition-all duration-300"
      style={{
        borderColor: "var(--line-soft)",
        background: scrolled
          ? "rgba(227,226,222,0.92)"
          : "rgba(227,226,222,0.78)",
        backdropFilter: "blur(10px) saturate(140%)",
        WebkitBackdropFilter: "blur(10px) saturate(140%)",
      }}
    >
      <div className="mx-auto max-w-[1320px] px-8">
        <div className="flex h-[70px] items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-3">
            <span
              className="grid h-[34px] w-[34px] place-items-center rounded-full font-display text-sm text-background transition-transform duration-300 group-hover:-rotate-[8deg] group-hover:scale-105"
              style={{ background: "var(--red)", letterSpacing: "0.04em" }}
            >
              C
            </span>
            <span className="flex flex-col leading-none">
              <b
                className="font-display text-lg font-normal"
                style={{ color: "var(--red)", letterSpacing: "0.02em" }}
              >
                CLBB
              </b>
              <span
                className="mt-1 text-[9.5px] uppercase tracking-[0.28em]"
                style={{ color: "var(--muted)" }}
              >
                Arq · Urbanismo · Eng. Civil
              </span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-7 md:flex">
            {[
              { href: "/", label: "Início" },
              { href: "/programacao", label: "Programação" },
              ...(showLoja ? [{ href: "/loja", label: "Loja" }] : []),
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative py-2 text-[12px] uppercase tracking-[0.18em] text-primary opacity-75 transition-all hover:text-accent hover:opacity-100"
              >
                {label}
              </Link>
            ))}
            {session && (
              <Link
                href="/minhas-palestras"
                className="relative py-2 text-[12px] uppercase tracking-[0.18em] text-primary opacity-75 transition-all hover:text-accent hover:opacity-100"
              >
                Minhas Palestras
              </Link>
            )}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2.5">
            {session ? (
              <>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="mr-2 text-[12px] uppercase tracking-[0.18em] text-primary opacity-75 transition-all hover:text-accent hover:opacity-100"
                >
                  Sair
                </button>
                <Link
                  href="/minhas-palestras"
                  className="inline-flex items-center gap-2 border border-transparent bg-accent px-4 py-2.5 text-[10.5px] uppercase tracking-[0.24em] text-background transition-all hover:bg-accent-dark hover:-translate-y-px"
                >
                  Painel <span>→</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center border border-border px-4 py-2.5 text-[10.5px] uppercase tracking-[0.24em] text-primary transition-all hover:border-accent hover:text-accent"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 border border-transparent bg-accent px-4 py-2.5 text-[10.5px] uppercase tracking-[0.24em] text-background transition-all hover:bg-accent-dark hover:-translate-y-px"
                >
                  Inscrever-se <span>→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
