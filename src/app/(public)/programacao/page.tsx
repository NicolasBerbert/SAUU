import { prisma } from "@/lib/db";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProgramacaoPage() {
  const session = await getServerSession(authOptions);

  let hasPaidRegistration = false;
  if (session?.user?.id) {
    const registration = await prisma.eventRegistration.findUnique({
      where: { userId: session.user.id },
      select: { paymentStatus: true },
    });
    hasPaidRegistration = registration?.paymentStatus === "APPROVED";
  }

  const ctaHref = !session ? "/cadastro" : hasPaidRegistration ? "/minhas-palestras" : "/minhas-palestras";
  const ctaLabel = !session ? "Inscrever-se" : hasPaidRegistration ? "Ver minhas palestras" : "Fazer inscrição";

  const presentations = await prisma.presentation.findMany({
    where: { active: true },
    include: { _count: { select: { slots: true } } },
    orderBy: [{ day: "asc" }, { slot: "asc" }],
  });

  const byDay = presentations.reduce<Record<number, typeof presentations>>(
    (acc, p) => {
      if (!acc[p.day]) acc[p.day] = [];
      acc[p.day].push(p);
      return acc;
    },
    {}
  );

  return (
    <main className="mx-auto max-w-[1320px] px-8 py-[140px]">
      {/* Header */}
      <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="mb-4 flex items-center gap-3.5">
            <span className="h-px w-8" style={{ background: "var(--red)" }} />
            <span className="eyebrow">CLBB 2026</span>
          </div>
          <h1
            className="font-display leading-[0.96] text-primary"
            style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}
          >
            Programação
            <br />
            <em style={{ color: "var(--red)" }}>completa</em>
          </h1>
        </div>
        <p className="self-end text-[17px] leading-[1.65] text-primary">
          Quatro noites, dois horários por noite — 19h00 e 20h45. Palestras
          gratuitas mediante inscrição. Clique nos dias para abrir os horários.
        </p>
      </div>

      {presentations.length === 0 ? (
        <div
          className="border px-16 py-20 text-center"
          style={{ border: "1px dashed var(--line)" }}
        >
          <p className="text-[14px] text-muted">A programação será divulgada em breve.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {[1, 2, 3, 4].map((day) => {
            const dayPresentations = byDay[day];
            if (!dayPresentations?.length) return null;
            return (
              <DayRow key={day} day={day} presentations={dayPresentations} />
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div
        className="mt-16 flex flex-wrap items-center justify-between gap-6 p-8"
        style={{ border: "1px solid var(--line)" }}
      >
        <div>
          <div className="mb-1 font-display text-2xl text-primary">Quer participar?</div>
          <div className="text-[13px] text-muted">
            Faça sua inscrição e selecione as palestras na sua área.
          </div>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2.5 border border-transparent px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] text-background transition-all hover:bg-accent-dark hover:-translate-y-px"
          style={{ background: "var(--red)" }}
        >
          {ctaLabel} <span>→</span>
        </Link>
      </div>
    </main>
  );
}

function DayRow({
  day,
  presentations,
}: {
  day: number;
  presentations: Array<{
    id: string;
    title: string;
    speaker: string;
    slot: string;
    maxCapacity: number;
    bio?: string | null;
    _count: { slots: number };
  }>;
}) {
  return (
    <details
      className="group"
      style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
    >
      <summary
        className="grid cursor-pointer select-none items-center gap-6 px-7 py-5 transition-colors hover:bg-background"
        style={{ gridTemplateColumns: "80px 1fr auto auto", listStyle: "none" }}
      >
        <span
          className="font-display text-[48px] leading-none"
          style={{ color: "var(--red)" }}
        >
          0{day}
        </span>
        <span className="text-[14px] tracking-[0.04em] text-primary">
          <small
            className="mb-1 block text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "var(--muted)" }}
          >
            Dia {day}
          </small>
          {presentations.length} palestra{presentations.length !== 1 ? "s" : ""}
        </span>
        <span
          className="text-[11px] uppercase tracking-[0.22em]"
          style={{ color: "var(--muted)" }}
        >
          {presentations.length} palestras
        </span>
        <span
          className="grid h-[34px] w-[34px] place-items-center rounded-full border text-[18px] transition-all duration-300 group-open:rotate-45"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          +
        </span>
      </summary>

      {presentations.map((p, i) => {
        const spotsLeft = p.maxCapacity - p._count.slots;
        const cls =
          spotsLeft <= 0
            ? "full"
            : spotsLeft <= 10
            ? "few"
            : "";
        return (
          <div
            key={p.id}
            className="grid items-center gap-6 px-7 py-5 transition-colors hover:bg-background"
            style={{
              gridTemplateColumns: "110px 1fr auto",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div>
              <div
                className="font-display text-[24px]"
                style={{ color: "var(--red)" }}
              >
                {p.slot}
              </div>
              <small
                className="mt-0.5 block text-[10px] uppercase tracking-[0.24em]"
                style={{ color: "var(--muted)" }}
              >
                Sessão {String.fromCharCode(65 + i)}
              </small>
            </div>
            <div>
              <div className="mb-1 text-[16px] text-primary">{p.title}</div>
              <div className="text-[13px] text-muted">{p.speaker}</div>
            </div>
            <div
              className="whitespace-nowrap px-3 py-2 text-[11px] uppercase tracking-[0.22em]"
              style={
                cls === "full"
                  ? {
                      background: "var(--ink)",
                      color: "var(--bg)",
                      border: "1px solid var(--ink)",
                    }
                  : cls === "few"
                  ? { color: "var(--red)", border: "1px solid var(--red)" }
                  : { color: "var(--muted)", border: "1px solid var(--line)" }
              }
            >
              {spotsLeft <= 0 ? "Esgotado" : `${spotsLeft} vagas`}
            </div>
          </div>
        );
      })}
    </details>
  );
}
