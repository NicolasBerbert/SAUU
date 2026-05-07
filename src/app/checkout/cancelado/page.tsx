import Link from "next/link";

export default function CheckoutCanceladoPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-8"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto w-full max-w-lg text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="h-px w-8" style={{ background: "var(--line)" }} />
          <span className="eyebrow">Pagamento cancelado</span>
          <span className="h-px w-8" style={{ background: "var(--line)" }} />
        </div>

        <div
          className="mb-8 p-12"
          style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
        >
          <div
            className="relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full"
            style={{ border: "1px solid var(--line)", color: "var(--muted)" }}
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1
            className="mb-3 font-display leading-none text-primary"
            style={{ fontSize: "36px" }}
          >
            Pagamento não concluído
          </h1>
          <p className="mb-8 text-[14px] text-muted">
            O pagamento foi cancelado. Nenhuma cobrança foi realizada.
            Você pode tentar novamente quando quiser.
          </p>
          <Link
            href="/minhas-palestras"
            className="inline-flex items-center gap-2.5 border border-transparent px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] text-background transition-all hover:-translate-y-px"
            style={{ background: "var(--ink)" }}
          >
            Tentar novamente <span>→</span>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6">
          <Link
            href="/"
            className="border-b border-current pb-0.5 text-[12px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
          >
            Página inicial
          </Link>
          <Link
            href="/programacao"
            className="border-b border-current pb-0.5 text-[12px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
          >
            Ver programação
          </Link>
        </div>
      </div>
    </main>
  );
}
