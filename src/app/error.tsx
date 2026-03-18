"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to server monitoring if added later
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-px w-8 bg-danger" />
          <span className="text-xs uppercase tracking-widest text-danger">Erro</span>
          <div className="h-px w-8 bg-danger" />
        </div>
        <h1 className="text-2xl font-light tracking-wide text-foreground mb-4">
          Algo deu errado
        </h1>
        <p className="text-sm text-muted mb-10">
          Ocorreu um erro inesperado. Se o problema persistir, entre em contato com a organização.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="text-xs uppercase tracking-widest border border-border px-6 py-3 text-foreground hover:border-accent hover:text-accent transition-colors"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest border border-accent px-6 py-3 text-accent hover:bg-accent hover:text-background transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
