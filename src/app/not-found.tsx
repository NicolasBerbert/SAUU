import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">404</span>
          <div className="h-px w-8 bg-accent" />
        </div>
        <h1 className="text-2xl font-light tracking-wide text-foreground mb-4">
          Página não encontrada
        </h1>
        <p className="text-sm text-muted mb-10">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest border border-accent px-6 py-3 text-accent hover:bg-accent hover:text-background transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
