import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CartSummary } from "@/components/checkout/CartSummary";
import { CartCheckoutButton } from "@/components/checkout/CartCheckoutButton";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId: session.user.id },
    select: { paymentStatus: true },
  });

  const inscricaoAprovada = registration?.paymentStatus === "APPROVED";
  const precoInscricao = Number(process.env.EVENT_REGISTRATION_PRICE ?? 50);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">Checkout</span>
        </div>
        <h1 className="text-3xl font-light text-primary mb-2">Seu Carrinho</h1>
        <p className="text-sm text-muted">
          Revise seus itens e conclua o pagamento.
          {!inscricaoAprovada && " Você pode incluir a inscrição no evento junto com seus produtos."}
        </p>
      </div>

      {/* Resumo do carrinho (client — lê do contexto) */}
      <div className="mb-8">
        <CartSummary
          precoInscricao={precoInscricao}
          inscricaoJaAprovada={inscricaoAprovada}
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
        />
      </div>

      {/* Botão de pagamento (client) */}
      <CartCheckoutButton precoInscricao={precoInscricao} />
    </main>
  );
}
