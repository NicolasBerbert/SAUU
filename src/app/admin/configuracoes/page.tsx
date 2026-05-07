import { getSiteConfig } from "@/lib/siteConfig";
import { LojaToggle } from "@/components/admin/LojaToggle";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracoesPage() {
  const lojaAtiva = (await getSiteConfig("lojaAtiva", "true")) === "true";

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-2">Configurações</h1>
      <p className="text-sm text-muted mb-10">
        Controle quais seções do site estão visíveis ao público.
      </p>

      <div style={{ border: "1px solid var(--line)" }}>
        <div
          className="border-b px-6 py-4"
          style={{ borderColor: "var(--line)", background: "var(--paper)" }}
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
            Visibilidade de páginas
          </p>
        </div>

        <div className="flex flex-col gap-px" style={{ background: "var(--line)" }}>
          {/* Loja toggle */}
          <div className="bg-surface px-6 py-5 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm text-primary mb-0.5">Página da Loja</p>
              <p className="text-xs text-muted">
                Quando desativada, a rota <code className="text-xs bg-background px-1 py-0.5">/loja</code> redireciona para a página inicial.
                O painel admin continua acessando normalmente.
              </p>
            </div>
            <LojaToggle initialValue={lojaAtiva} />
          </div>
        </div>
      </div>
    </div>
  );
}
