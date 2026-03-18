import { prisma } from "@/lib/db";
import { slotLabel } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/Button";

const SLOTS = ["SLOT_19H00", "SLOT_20H45"] as const;

export default async function ProgramacaoPage() {
  const presentations = await prisma.presentation.findMany({
    where: { active: true },
    include: { _count: { select: { slots: true } } },
    orderBy: [{ day: "asc" }, { slot: "asc" }],
  });

  // Agrupar por dia
  const byDay = presentations.reduce<Record<number, typeof presentations>>(
    (acc, p) => {
      if (!acc[p.day]) acc[p.day] = [];
      acc[p.day].push(p);
      return acc;
    },
    {}
  );

  const hasAnyPresentation = presentations.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">SAUU</span>
        </div>
        <h1 className="text-4xl font-light text-primary mb-3">Programação</h1>
        <p className="text-sm text-muted max-w-lg">
          Cinco dias de palestras com profissionais e pesquisadores da área de
          arquitetura e urbanismo.
        </p>
      </div>

      {!hasAnyPresentation ? (
        <div className="border border-border border-dashed p-16 text-center">
          <p className="text-sm text-muted">
            A programação será divulgada em breve.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {[1, 2, 3, 4, 5].map((day) => {
            const dayPresentations = byDay[day];
            if (!dayPresentations?.length) return null;

            return (
              <div key={day} className="border border-border">
                {/* Header do dia */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface">
                  <span className="text-2xl font-light text-accent">0{day}</span>
                  <div className="h-8 w-px bg-border" />
                  <span className="text-xs uppercase tracking-widest text-muted">
                    Dia {day}
                  </span>
                </div>

                {/* Palestras */}
                <div className="flex flex-col gap-px bg-border">
                  {SLOTS.map((slot) => {
                    const p = dayPresentations.find((x) => x.slot === slot);

                    if (!p) {
                      return (
                        <div key={slot} className="bg-surface px-6 py-6">
                          <p className="text-xs text-muted">
                            {slotLabel(slot)} — A confirmar
                          </p>
                        </div>
                      );
                    }

                    const spotsLeft = p.maxCapacity - p._count.slots;

                    return (
                      <div key={slot} className="bg-surface px-6 py-6 flex flex-col sm:flex-row sm:items-start gap-6">
                        {/* Horário */}
                        <div className="shrink-0 w-16">
                          <span className="text-xs font-medium text-accent">
                            {slotLabel(slot)}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-primary mb-1">
                            {p.title}
                          </h3>
                          <p className="text-sm text-muted mb-2">{p.speaker}</p>
                          {p.bio && (
                            <p className="text-xs text-muted leading-relaxed line-clamp-2">
                              {p.bio}
                            </p>
                          )}
                        </div>

                        {/* Vagas */}
                        <div className="shrink-0 flex items-center gap-3 sm:flex-col sm:items-end">
                          <span
                            className={`text-xs ${
                              spotsLeft <= 0
                                ? "text-danger"
                                : spotsLeft <= 10
                                ? "text-accent"
                                : "text-muted"
                            }`}
                          >
                            {spotsLeft <= 0
                              ? "Esgotado"
                              : `${spotsLeft} vagas`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA inscrição */}
      <div className="mt-16 border border-border p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-base text-primary mb-1">Quer participar?</p>
          <p className="text-sm text-muted">Faça sua inscrição e selecione as palestras.</p>
        </div>
        <Link href="/cadastro">
          <Button variant="primary" className="text-xs tracking-widest uppercase px-8 py-3">
            Inscrever-se
          </Button>
        </Link>
      </div>
    </main>
  );
}
