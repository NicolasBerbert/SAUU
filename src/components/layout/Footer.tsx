import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="mt-20 px-8 py-20"
      style={{ background: "var(--ink)", color: "var(--bg)" }}
    >
      <div className="mx-auto max-w-[1320px]">
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-4 sm:gap-16">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div
              className="mb-4 font-display text-5xl leading-none"
              style={{ color: "var(--bg)" }}
            >
              CLBB
              <br />
              <span
                className="italic"
                style={{ color: "var(--red-soft)" }}
              >
                2026
              </span>
            </div>
            <p
              className="max-w-xs text-[13px] leading-relaxed"
              style={{ color: "rgba(227,226,222,0.7)" }}
            >
              Comissão Lina Bo Bardi — semana acadêmica dos cursos de
              Arquitetura e Urbanismo e Engenharia Civil da Unifil, em
              Londrina, Paraná.
            </p>
          </div>

          {/* Evento */}
          <div>
            <h5
              className="mb-4 text-[10px] uppercase tracking-[0.32em]"
              style={{ color: "rgba(227,226,222,0.55)" }}
            >
              Evento
            </h5>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/programacao", label: "Programação" },
                { href: "/loja", label: "Loja" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] transition-colors hover:text-accent-light"
                    style={{ color: "rgba(227,226,222,0.78)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Acesso */}
          <div>
            <h5
              className="mb-4 text-[10px] uppercase tracking-[0.32em]"
              style={{ color: "rgba(227,226,222,0.55)" }}
            >
              Acesso
            </h5>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/login", label: "Entrar" },
                { href: "/cadastro", label: "Cadastrar-se" },
                { href: "/minhas-palestras", label: "Minhas palestras" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] transition-colors hover:text-accent-light"
                    style={{ color: "rgba(227,226,222,0.78)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h5
              className="mb-4 text-[10px] uppercase tracking-[0.32em]"
              style={{ color: "rgba(227,226,222,0.55)" }}
            >
              Contato
            </h5>
            <ul className="flex flex-col gap-2.5">
              {["sarqurbunifil@gmail.com", "Unifil · Londrina, PR"].map(
                (item) => (
                  <li
                    key={item}
                    className="text-[13px]"
                    style={{ color: "rgba(227,226,222,0.78)" }}
                  >
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-16 flex flex-col items-center justify-between gap-3 border-t pt-6 text-[11px] uppercase tracking-[0.18em] sm:flex-row"
          style={{
            borderColor: "rgba(227,226,222,0.12)",
            color: "rgba(227,226,222,0.5)",
          }}
        >
          <span>CLBB · Comissão Lina Bo Bardi</span>
          <span>Unifil © {new Date().getFullYear()} · todos os direitos reservados</span>
        </div>
      </div>
    </footer>
  );
}
