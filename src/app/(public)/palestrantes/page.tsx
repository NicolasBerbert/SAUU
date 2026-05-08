import { prisma } from "@/lib/db";
import Image from "next/image";

export const dynamic = "force-dynamic";

const PLACEHOLDER_SPEAKERS = [
  {
    speaker: "Ana Carolina Duarte",
    bio: "Arquiteta e urbanista pela FAU-USP, mestre em planejamento urbano pela Universidade de Barcelona. Coordena o escritório ACD Arquitetura, com projetos premiados em habitação de interesse social.",
    imageUrl: "https://i.pravatar.cc/400?img=47",
    talks: [{ id: "p1", title: "Habitação como direito: experiências em HIS no Brasil", day: 1, slot: "19:00" }],
  },
  {
    speaker: "Rodrigo Menezes",
    bio: "Engenheiro civil formado pela UFPR, especialista em estruturas metálicas. Professor da pós-graduação da Unifil e consultor de grandes obras industriais no Paraná.",
    imageUrl: "https://i.pravatar.cc/400?img=12",
    talks: [{ id: "p2", title: "Estruturas metálicas: do projeto à montagem", day: 1, slot: "20:45" }],
  },
  {
    speaker: "Fernanda Lopes",
    bio: "Doutora em teoria e história da arquitetura pela UFMG. Pesquisadora do Modernismo Brasileiro e diretora do Instituto de Patrimônio de Belo Horizonte.",
    imageUrl: "https://i.pravatar.cc/400?img=44",
    talks: [{ id: "p3", title: "Modernismo e identidade: revisitando o legado de Niemeyer", day: 2, slot: "19:00" }],
  },
  {
    speaker: "Paulo Saraiva",
    bio: "Arquiteto pela PUC-PR, especialista em sistemas construtivos em madeira e bambu. Fundador do coletivo Construção Viva, voltado à arquitetura bioclimática.",
    imageUrl: "https://i.pravatar.cc/400?img=15",
    talks: [{ id: "p4", title: "Bioclimatismo e materialidade: construir com o lugar", day: 2, slot: "20:45" }],
  },
  {
    speaker: "Mariana Okafor",
    bio: "Urbanista e geógrafa pela UNICAMP. Pesquisadora de mobilidade urbana e acessibilidade, consultora da prefeitura de Curitiba no plano diretor cicloviário.",
    imageUrl: "https://i.pravatar.cc/400?img=49",
    talks: [{ id: "p5", title: "Cidade para quem? Mobilidade e direito ao espaço público", day: 3, slot: "19:00" }],
  },
  {
    speaker: "Gabriel Trevisan",
    bio: "Engenheiro civil pela UEL, mestre em geotecnia pela UNICAMP. Atua em projetos de fundações para grandes viadutos e obras de arte especiais no sul do Brasil.",
    imageUrl: "https://i.pravatar.cc/400?img=8",
    talks: [{ id: "p6", title: "Fundações em solos complexos: casos do Paraná", day: 3, slot: "20:45" }],
  },
  {
    speaker: "Beatriz Salles",
    bio: "Arquiteta e cenógrafa pela UNESP, com passagem pela Escola de Arquitetura de Lisboa. Dirige o estúdio Sensorama, especializado em arquitetura efêmera e instalações culturais.",
    imageUrl: "https://i.pravatar.cc/400?img=32",
    talks: [{ id: "p7", title: "Arquitetura efêmera: espaço, tempo e experiência", day: 4, slot: "19:00" }],
  },
  {
    speaker: "Carlos Nishimura",
    bio: "Engenheiro civil e pesquisador em patologia das construções pela UTFPR. Consultor em manutenção predial e inspeções técnicas em edificações históricas.",
    imageUrl: "https://i.pravatar.cc/400?img=53",
    talks: [{ id: "p8", title: "Patologia e durabilidade: o edifício ao longo do tempo", day: 4, slot: "20:45" }],
  },
];

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

  const speakerMap = new Map<string, {
    speaker: string;
    bio: string | null;
    imageUrl: string | null;
    talks: { id: string; title: string; day: number; slot: string }[];
  }>();

  for (const p of presentations) {
    if (!speakerMap.has(p.speaker)) {
      speakerMap.set(p.speaker, { speaker: p.speaker, bio: p.bio, imageUrl: p.imageUrl, talks: [] });
    }
    speakerMap.get(p.speaker)!.talks.push({ id: p.id, title: p.title, day: p.day, slot: p.slot });
  }

  const speakers = speakerMap.size > 0 ? Array.from(speakerMap.values()) : PLACEHOLDER_SPEAKERS;
  const isPlaceholder = speakerMap.size === 0;

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

      {isPlaceholder && (
        <div
          className="mb-8 px-5 py-3 text-[11px] uppercase tracking-[0.2em]"
          style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--muted)" }}
        >
          Prévia — palestrantes serão confirmados em breve
        </div>
      )}

      <div
        className="grid gap-px sm:grid-cols-2 lg:grid-cols-3"
        style={{ background: "var(--line)", border: "1px solid var(--line)" }}
      >
        {speakers.map((s) => (
          <div
            key={s.speaker}
            className="flex flex-col"
            style={{ background: "var(--paper)", opacity: isPlaceholder ? 0.72 : 1 }}
          >
            {/* Photo */}
            <div
              className="relative w-full overflow-hidden"
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
              <h2 className="mb-3 font-display text-[22px] leading-none text-primary">
                {s.speaker}
              </h2>

              {/* Talks */}
              <div className="mb-4 flex flex-col gap-1.5">
                {s.talks.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
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
    </main>
  );
}
