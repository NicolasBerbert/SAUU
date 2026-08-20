import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckoutButton } from "@/components/checkout/CheckoutButton";
import { slotLabel } from "@/lib/utils";

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

  const byDay = slots.reduce<Record<number, typeof slots>>((acc, slot) => {
    const day = slot.presentation.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  const firstName = session.user.name.split(" ")[0];

  return (
    <div>
      {/* Page header */}
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3.5">
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
          <span className="eyebrow">Painel</span>
        </div>
        <h1
          className="mb-2 font-display leading-none"
          style={{ fontSize: "56px" }}
        >
          Olá,{" "}
          <em style={{ color: "var(--red)" }}>{firstName}</em>
        </h1>
        <p className="text-[14px] text-muted">
          Gerencie suas inscrições e palestras abaixo.
        </p>
      </div>

      {/* Status card */}
      <div
        className="mb-12 grid items-center gap-8 p-8"
        style={{
          border: "1px solid var(--line)",
          background: "var(--paper)",
          gridTemplateColumns: "auto 1fr auto",
        }}
      >
        <div
          className="relative grid h-16 w-16 place-items-center rounded-full font-display text-2xl"
          style={{ border: "1px solid var(--red)", color: "var(--red)" }}
        >
          {isPaid ? "✓" : isPending ? "…" : "○"}
        </div>

        <div>
          {!registration && (
            <>
              <h3 className="mb-1 font-display text-[28px] text-primary">
                Inscrição pendente
              </h3>
              <p className="text-[13px] text-muted">
                Pague a inscrição para selecionar as palestras.
              </p>
            </>
          )}
          {isPending && (
            <>
              <h3 className="mb-1 font-display text-[28px] text-primary">
                Pagamento em processamento
              </h3>
              <p className="text-[13px] text-muted">
                Seu pagamento ainda está sendo processado.
              </p>
            </>
          )}
          {isPaid && (
            <>
              <h3 className="mb-1 font-display text-[28px] text-primary">
                Inscrição confirmada
              </h3>
              <p className="text-[13px] text-muted">
                Você já pode selecionar suas palestras nos quatro dias.
              </p>
            </>
          )}
        </div>

        <div>
          {!registration && (
            <CheckoutButton price={Number(process.env.EVENT_REGISTRATION_PRICE ?? 50)} />
          )}
          {isPending && (
            <CheckoutButton price={Number(process.env.EVENT_REGISTRATION_PRICE ?? 50)} />
          )}
          {isPaid && (
            <Link href="/inscricao">
              <Button variant="primary">
                Selecionar palestras <span>→</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Lectures list */}
      {isPaid && (
        <div>
          <div
            className="mb-6 text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "var(--muted)" }}
          >
            Palestras selecionadas · {slots.length} de 4
          </div>

          {slots.length === 0 ? (
            <div
              className="p-10 text-center"
              style={{ border: "1px dashed var(--line)" }}
            >
              <p className="mb-4 text-[14px] text-muted">
                Você ainda não selecionou nenhuma palestra.
              </p>
              <Link href="/inscricao">
                <Button variant="secondary">Selecionar agora</Button>
              </Link>
            </div>
          ) : (
            <div
              className="flex flex-col gap-px"
              style={{ background: "var(--line)", border: "1px solid var(--line)" }}
            >
              {[1, 2, 3, 4].map((day) => {
                const daySlots = byDay[day];
                if (!daySlots?.length) return null;
                return (
                  <div key={day} style={{ background: "var(--paper)" }}>
                    <div
                      className="border-b px-7 py-3"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <p
                        className="text-[10px] uppercase tracking-[0.3em]"
                        style={{ color: "var(--muted)" }}
                      >
                        Dia {day}
                      </p>
                    </div>
                    {daySlots.map((slot) => (
                      <div
                        key={slot.presentation.id}
                        className="grid items-center gap-6 px-7 py-5"
                        style={{
                          gridTemplateColumns: "80px 1fr auto",
                          borderTop: "1px solid var(--line)",
                        }}
                      >
                        <div
                          className="font-display text-[22px]"
                          style={{ color: "var(--red)" }}
                        >
                          {slot.presentation.slot}
                          <small
                            className="mt-0.5 block font-sans text-[10px] uppercase tracking-[0.24em]"
                            style={{ color: "var(--muted)" }}
                          >
                            Dia {day}
                          </small>
                        </div>
                        <div>
                          <div className="mb-1 text-[15px] text-primary">
                            {slot.presentation.title}
                          </div>
                          <div className="text-[12px] text-muted">
                            {slotLabel(slot.presentation.slot)} —{" "}
                            {slot.presentation.speaker}
                          </div>
                        </div>
                        <span
                          className="whitespace-nowrap px-2.5 py-1.5 text-[10px] uppercase tracking-[0.24em]"
                          style={{
                            border: "1px solid var(--sage)",
                            color: "var(--sage)",
                          }}
                        >
                          Confirmada
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
