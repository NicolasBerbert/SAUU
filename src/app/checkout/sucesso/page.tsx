import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function CheckoutSucessoPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-lg mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">Confirmado</span>
          <div className="h-px w-8 bg-accent" />
        </div>

        <div className="border border-border p-12 mb-8">
          <div className="w-12 h-12 border border-accent/40 flex items-center justify-center mx-auto mb-6">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-primary mb-3">Inscrição confirmada</h1>
          <p className="text-sm text-muted mb-8">
            Sua inscrição no SAUU foi confirmada. Agora você pode selecionar as palestras que deseja assistir.
          </p>
          <Link href="/inscricao">
            <Button variant="primary" className="text-xs tracking-widest uppercase px-8 py-3">
              Selecionar palestras
            </Button>
          </Link>
        </div>

        <Link
          href="/minhas-palestras"
          className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors"
        >
          Ver minha área
        </Link>
      </div>
    </main>
  );
}
