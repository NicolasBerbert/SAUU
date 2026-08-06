import Link from "next/link";
import { processarPagamentoMp } from "@/lib/mercadopago";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ payment_id?: string; collection_id?: string; status?: string }>;
}

export default async function CheckoutSucessoPage({ searchParams }: Props) {
  const params = await searchParams;
  // O Mercado Pago retorna com payment_id/collection_id. O webhook é a fonte
  // principal, mas aqui confirmamos também (idempotente) — a checagem real do
  // status é feita reconsultando o pagamento na API do MP, não confiando na URL.
  const paymentId = params.payment_id ?? params.collection_id;
  if (paymentId) {
    try {
      await processarPagamentoMp(paymentId);
    } catch {
      // Se falhar aqui, o webhook do Mercado Pago ainda confirma o pagamento.
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
            Inscrição confirmada
          </h1>
          <p className="mb-8 text-[14px] text-muted">
            Sua inscrição foi confirmada. Agora você pode selecionar as
            palestras que deseja assistir.
          </p>
          <Link href="/inscricao">
            <Button variant="primary" className="px-8 py-3.5">
              Selecionar palestras <span>→</span>
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
