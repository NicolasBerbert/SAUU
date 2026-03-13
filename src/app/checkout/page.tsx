import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CheckoutButton } from "@/components/checkout/CheckoutButton";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId: session.user.id },
  });

  if (registration?.paymentStatus === "APPROVED") {
    redirect("/minhas-palestras");
  }

  const price = Number(process.env.EVENT_REGISTRATION_PRICE ?? 50);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-accent" />
            <span className="text-xs uppercase tracking-widest text-accent">Inscrição</span>
          </div>
          <h1 className="text-3xl font-light text-primary mb-2">Confirmar Inscrição</h1>
          <p className="text-sm text-muted">
            Acesso completo ao evento: 5 dias de palestras com profissionais da área.
          </p>
        </div>

        {/* Resumo */}
        <div className="border border-border mb-6">
          <div className="px-6 py-4 border-b border-border bg-surface">
            <p className="text-xs uppercase tracking-widest text-muted">Resumo</p>
          </div>
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-primary mb-0.5">SAUU — Semana de Arquitetura Unifil</p>
              <p className="text-xs text-muted">Inscrição no evento — acesso a todas as palestras</p>
            </div>
            <span className="text-sm font-medium text-primary ml-6 shrink-0">
              R$ {price.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="px-6 py-4 border-t border-border bg-surface flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted">Total</p>
            <p className="text-base text-accent">R$ {price.toFixed(2).replace(".", ",")}</p>
          </div>
        </div>

        {/* Info participante */}
        <div className="border border-border mb-8">
          <div className="px-6 py-4 border-b border-border bg-surface">
            <p className="text-xs uppercase tracking-widest text-muted">Participante</p>
          </div>
          <div className="px-6 py-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Nome</p>
              <p className="text-xs text-primary">{session.user.name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">E-mail</p>
              <p className="text-xs text-primary">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Aviso placeholder */}
        <div className="border border-accent/20 bg-accent/5 px-4 py-3 mb-6">
          <p className="text-xs text-accent/80">
            Ambiente de testes — nenhuma cobrança real será realizada.
          </p>
        </div>

        {/* Botão */}
        <CheckoutButton price={price} />
      </div>
    </main>
  );
}
