import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-8"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-md text-center">
        <div
          className="mb-4 font-display leading-none"
          style={{ fontSize: "120px", color: "var(--red)", opacity: 0.15 }}
        >
          404
        </div>
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
          <span className="eyebrow">Página não encontrada</span>
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
        </div>
        <h1
          className="mb-3 font-display leading-none text-primary"
          style={{ fontSize: "32px" }}
        >
          Ops, nada aqui
        </h1>
        <p className="mb-10 text-[14px] text-muted">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 border border-transparent px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] text-background transition-all hover:bg-accent-dark"
          style={{ background: "var(--red)" }}
        >
          Voltar ao início <span>→</span>
        </Link>
      </div>
    </div>
  );
}
