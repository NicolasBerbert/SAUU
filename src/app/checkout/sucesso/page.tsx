import Link from "next/link";
import { aprovarPedidoStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

// Retorno do Stripe (pedido da loja). O webhook é a fonte principal; aqui
// confirmamos também (idempotente), reconsultando a sessão na API do Stripe.
export default async function CheckoutSucessoPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  if (session_id) {
    try {
      await aprovarPedidoStripe(session_id);
    } catch {
      // Se falhar aqui, o webhook do Stripe ainda confirma o pedido.
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-8"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto w-full max-w-lg text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
          <span className="eyebrow">Confirmado</span>
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
        </div>

        <div
          className="mb-8 p-12"
          style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
        >
          <div
            className="relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full font-display text-2xl"
            style={{ border: "1px solid var(--red)", color: "var(--red)" }}
          >
            ✓
            <span
              className="absolute inset-[-6px] rounded-full"
              style={{
                border: "1px solid var(--red)",
                opacity: 0.25,
                animation: "pulseRing 2.4s ease-in-out infinite",
              }}
            />
          </div>
          <h1
            className="mb-3 font-display leading-none text-primary"
            style={{ fontSize: "36px" }}
          >
            Pedido confirmado
          </h1>
          <p className="mb-8 text-[14px] text-muted">
            Recebemos o pagamento do seu pedido. Enviamos um e-mail com o resumo,
            e a retirada dos produtos será combinada durante o evento.
          </p>
          <Link href="/loja">
            <Button variant="primary" className="px-8 py-3.5">
              Voltar à loja <span>→</span>
            </Button>
          </Link>
        </div>

        <Link
          href="/minhas-palestras"
          className="border-b border-current pb-0.5 text-[12px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
        >
          Ver minha área
        </Link>
      </div>
    </main>
  );
}
