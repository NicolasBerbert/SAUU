import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

// Confirmação no retorno do pagamento. O webhook do Stripe continua sendo a
// fonte principal de verdade (e envia o e-mail de confirmação), mas aqui
// garantimos a aprovação de forma idempotente caso o webhook atrase ou não
// esteja configurado — assim o status persiste no banco, não só nesta tela.
async function confirmarPagamento(sessionId: string | undefined) {
  if (!sessionId) return;

  const auth = await getServerSession(authOptions);
  if (!auth?.user?.id) return;

  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    const meta = (stripeSession.metadata ?? {}) as {
      userId?: string;
      tipo?: string;
      incluirInscricao?: string;
      orderId?: string;
    };

    // Só aprova se o pagamento foi realmente coletado e pertence a este usuário.
    if (stripeSession.payment_status !== "paid" || meta.userId !== auth.user.id) {
      return;
    }

    const aprovaInscricao = meta.tipo === "inscricao" || meta.incluirInscricao === "true";

    if (aprovaInscricao) {
      await prisma.eventRegistration.updateMany({
        where: { userId: auth.user.id, paymentStatus: { not: "APPROVED" } },
        data: { paymentStatus: "APPROVED", paymentId: stripeSession.id },
      });
    }

    if (meta.orderId) {
      await prisma.order.updateMany({
        where: { id: meta.orderId, status: { not: "APPROVED" } },
        data: { status: "APPROVED", paymentId: stripeSession.id },
      });
    }
  } catch {
    // Em caso de falha aqui, o webhook do Stripe ainda confirma o pagamento.
  }
}

export default async function CheckoutSucessoPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  await confirmarPagamento(session_id);

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
