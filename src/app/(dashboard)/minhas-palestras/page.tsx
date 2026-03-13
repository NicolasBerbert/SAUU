import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { slotLabel, formatCurrency } from "@/lib/utils";

export default async function MinhasPalestrasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      eventRegistration: true,
      presentationSlots: {
        include: { presentation: true },
        orderBy: [
          { presentation: { day: "asc" } },
          { presentation: { slot: "asc" } },
        ],
      },
    },
  });

  const registration = user?.eventRegistration;
  const isPaid = registration?.paymentStatus === "APPROVED";
  const isPending = registration?.paymentStatus === "PENDING";
  const slots = user?.presentationSlots ?? [];

  // Agrupar por dia
  const byDay = slots.reduce<Record<number, typeof slots>>((acc, slot) => {
    const day = slot.presentation.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Dashboard</span>
      </div>

      <h1 className="text-3xl font-light text-primary mb-2">Minhas Palestras</h1>
      <p className="text-sm text-muted mb-10">
        Olá, {session.user.name.split(" ")[0]}. Gerencie suas inscrições abaixo.
      </p>

      {/* Status da inscrição */}
      <div className="border border-border p-6 mb-10">
        <p className="text-xs uppercase tracking-widest text-muted mb-4">Status da inscrição</p>

        {!registration && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-primary mb-1">Inscrição não realizada</p>
              <p className="text-xs text-muted">
                Pague a inscrição para selecionar as palestras.
              </p>
            </div>
            <Link href="/checkout">
              <Button variant="primary" className="text-xs tracking-widest uppercase whitespace-nowrap">
                Inscrever-se —{" "}
                {formatCurrency(Number(process.env.EVENT_REGISTRATION_PRICE ?? 50))}
              </Button>
            </Link>
          </div>
        )}

        {isPending && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-primary mb-1">Pagamento pendente</p>
              <p className="text-xs text-muted">
                Seu pagamento ainda está sendo processado.
              </p>
            </div>
            <Link href="/checkout">
              <Button variant="secondary" className="text-xs tracking-widest uppercase">
                Tentar novamente
              </Button>
            </Link>
          </div>
        )}

        {isPaid && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-success mb-1">Inscrição confirmada</p>
              <p className="text-xs text-muted">
                Você pode selecionar as palestras que deseja assistir.
              </p>
            </div>
            <Link href="/inscricao">
              <Button variant="primary" className="text-xs tracking-widest uppercase">
                Selecionar palestras
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Lista de palestras */}
      {isPaid && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-6">
            Palestras selecionadas ({slots.length})
          </p>

          {slots.length === 0 ? (
            <div className="border border-border border-dashed p-10 text-center">
              <p className="text-sm text-muted mb-4">
                Você ainda não selecionou nenhuma palestra.
              </p>
              <Link href="/inscricao">
                <Button variant="secondary" className="text-xs tracking-widest uppercase">
                  Selecionar agora
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-px bg-border">
              {[1, 2, 3, 4, 5].map((day) => {
                const daySlots = byDay[day];
                if (!daySlots?.length) return null;
                return (
                  <div key={day} className="bg-surface">
                    <div className="px-6 py-3 border-b border-border">
                      <p className="text-xs uppercase tracking-widest text-muted">
                        Dia {day}
                      </p>
                    </div>
                    {daySlots.map((slot) => (
                      <div
                        key={slot.presentation.id}
                        className="flex items-center justify-between px-6 py-4"
                      >
                        <div>
                          <p className="text-sm text-primary mb-0.5">
                            {slot.presentation.title}
                          </p>
                          <p className="text-xs text-muted">
                            {slotLabel(slot.presentation.slot)} —{" "}
                            {slot.presentation.speaker}
                          </p>
                        </div>
                        <span className="text-xs text-accent border border-accent/30 px-2 py-1 ml-4 shrink-0">
                          {slotLabel(slot.presentation.slot)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
