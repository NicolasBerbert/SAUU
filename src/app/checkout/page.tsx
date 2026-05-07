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
    <main
      className="min-h-screen px-8 py-16"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3.5">
            <span className="h-px w-8" style={{ background: "var(--red)" }} />
            <span className="eyebrow">Checkout</span>
          </div>
          <h1
            className="mb-2 font-display leading-none text-primary"
            style={{ fontSize: "48px" }}
          >
            Sua{" "}
            <em style={{ color: "var(--red)" }}>sacola</em>
          </h1>
          <p className="text-[14px] text-muted">
            Revise seus itens e conclua o pagamento.
            {!inscricaoAprovada &&
              " Você pode incluir a inscrição no evento junto com seus produtos."}
          </p>
        </div>

        <div className="mb-8">
          <CartSummary
            precoInscricao={precoInscricao}
            inscricaoJaAprovada={inscricaoAprovada}
            userName={session.user.name ?? ""}
            userEmail={session.user.email ?? ""}
          />
        </div>

        <CartCheckoutButton precoInscricao={precoInscricao} />
      </div>
    </main>
  );
}
