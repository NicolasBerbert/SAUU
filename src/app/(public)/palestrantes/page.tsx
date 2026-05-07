import { prisma } from "@/lib/db";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function PalestrantesPage() {
  const presentations = await prisma.presentation.findMany({
    where: { active: true },
    orderBy: [{ day: "asc" }, { slot: "asc" }],
    select: {
      id: true,
      title: true,
      speaker: true,
      bio: true,
      imageUrl: true,
      day: true,
      slot: true,
    },
  });

  // Group by speaker name so a speaker with 2 talks appears once
  const speakerMap = new Map<string, {
    speaker: string;
    bio: string | null;
    imageUrl: string | null;
    talks: { id: string; title: string; day: number; slot: string }[];
  }>();

  for (const p of presentations) {
    if (!speakerMap.has(p.speaker)) {
      speakerMap.set(p.speaker, {
        speaker: p.speaker,
        bio: p.bio,
        imageUrl: p.imageUrl,
        talks: [],
      });
    }
    speakerMap.get(p.speaker)!.talks.push({
      id: p.id,
      title: p.title,
      day: p.day,
      slot: p.slot,
    });
  }

  const speakers = Array.from(speakerMap.values());

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
            Palestrantes
            <br />
            <em style={{ color: "var(--red)" }}>convidados</em>
          </h1>
        </div>
        <p className="self-end text-[17px] leading-[1.65] text-primary">
          Profissionais e pesquisadores convidados para as quatro noites do
          SAUU + SEC 2026, reunidos pela Comissão Lina Bo Bardi.
        </p>
      </div>

      {speakers.length === 0 ? (
        <div
          className="border px-16 py-20 text-center"
          style={{ border: "1px dashed var(--line)" }}
        >
          <p className="text-[14px] text-muted">
            Os palestrantes serão divulgados em breve.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-px sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: "var(--line)", border: "1px solid var(--line)" }}
        >
          {speakers.map((s) => (
            <div
              key={s.speaker}
              className="flex flex-col"
              style={{ background: "var(--paper)" }}
            >
              {/* Photo */}
              <div
                className="relative w-full"
                style={{ aspectRatio: "4/3", background: "var(--surface)" }}
              >
                {s.imageUrl ? (
                  <Image
                    src={s.imageUrl}
                    alt={s.speaker}
                    fill
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span
                      className="font-display text-[64px] leading-none"
                      style={{ color: "var(--line)" }}
                    >
                      {s.speaker.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-7">
                <h2 className="mb-1 font-display text-[22px] leading-none text-primary">
                  {s.speaker}
                </h2>

                {/* Talks */}
                <div className="mb-4 flex flex-col gap-1.5">
                  {s.talks.map((t) => (
                    <div key={t.id} className="flex items-baseline gap-2">
                      <span
                        className="shrink-0 text-[10px] uppercase tracking-[0.22em]"
                        style={{ color: "var(--red)" }}
                      >
                        Dia {t.day} · {t.slot}
                      </span>
                      <span className="text-[12px] text-muted">{t.title}</span>
                    </div>
                  ))}
                </div>

                {s.bio && (
                  <p className="mt-auto text-[13px] leading-[1.65] text-muted">
                    {s.bio}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
