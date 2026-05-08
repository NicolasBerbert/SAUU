import { prisma } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PLACEHOLDER_SPEAKERS = [
  { speaker: "Ana Carolina Duarte", bio: "Arquiteta e urbanista pela FAU-USP, mestre em planejamento urbano pela Universidade de Barcelona. Coordena o escritório ACD Arquitetura, com projetos premiados em habitação de interesse social.", imageUrl: "https://i.pravatar.cc/600?img=47", talks: [{ id: "p1", title: "Habitação como direito", day: 1, slot: "19:00" }] },
  { speaker: "Rodrigo Menezes", bio: "Engenheiro civil formado pela UFPR, especialista em estruturas metálicas. Professor da pós-graduação da Unifil e consultor de grandes obras industriais no Paraná.", imageUrl: "https://i.pravatar.cc/600?img=12", talks: [{ id: "p2", title: "Estruturas metálicas: do projeto à montagem", day: 1, slot: "20:45" }] },
  { speaker: "Fernanda Lopes", bio: "Doutora em teoria e história da arquitetura pela UFMG. Pesquisadora do Modernismo Brasileiro e diretora do Instituto de Patrimônio de Belo Horizonte.", imageUrl: "https://i.pravatar.cc/600?img=44", talks: [{ id: "p3", title: "Modernismo e identidade: o legado de Niemeyer", day: 2, slot: "19:00" }] },
  { speaker: "Paulo Saraiva", bio: "Arquiteto pela PUC-PR, especialista em sistemas construtivos em madeira e bambu. Fundador do coletivo Construção Viva, voltado à arquitetura bioclimática.", imageUrl: "https://i.pravatar.cc/600?img=15", talks: [{ id: "p4", title: "Bioclimatismo e materialidade: construir com o lugar", day: 2, slot: "20:45" }] },
  { speaker: "Mariana Okafor", bio: "Urbanista e geógrafa pela UNICAMP. Pesquisadora de mobilidade urbana e acessibilidade, consultora da prefeitura de Curitiba.", imageUrl: "https://i.pravatar.cc/600?img=49", talks: [{ id: "p5", title: "Cidade para quem? Mobilidade e espaço público", day: 3, slot: "19:00" }] },
  { speaker: "Gabriel Trevisan", bio: "Engenheiro civil pela UEL, mestre em geotecnia pela UNICAMP. Atua em fundações para grandes viadutos e obras especiais no sul do Brasil.", imageUrl: "https://i.pravatar.cc/600?img=8", talks: [{ id: "p6", title: "Fundações em solos complexos: casos do Paraná", day: 3, slot: "20:45" }] },
  { speaker: "Beatriz Salles", bio: "Arquiteta e cenógrafa pela UNESP, com passagem pela Escola de Arquitetura de Lisboa. Dirige o estúdio Sensorama, especializado em arquitetura efêmera.", imageUrl: "https://i.pravatar.cc/600?img=32", talks: [{ id: "p7", title: "Arquitetura efêmera: espaço, tempo e experiência", day: 4, slot: "19:00" }] },
  { speaker: "Carlos Nishimura", bio: "Engenheiro civil e pesquisador em patologia das construções pela UTFPR. Consultor em manutenção predial e inspeções técnicas em edificações históricas.", imageUrl: "https://i.pravatar.cc/600?img=53", talks: [{ id: "p8", title: "Patologia e durabilidade: o edifício ao longo do tempo", day: 4, slot: "20:45" }] },
];

export default async function PalestrantesPage() {
  const presentations = await prisma.presentation.findMany({
    where: { active: true },
    orderBy: [{ day: "asc" }, { slot: "asc" }],
    select: { id: true, title: true, speaker: true, bio: true, imageUrl: true, day: true, slot: true },
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

      {/* ── HEADER ── */}
      <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-4 flex items-center gap-3.5">
            <span className="h-px w-8" style={{ background: "var(--red)" }} />
            <span className="eyebrow">CLBB 2026</span>
          </div>
          <h1
            className="font-display leading-[0.88] text-primary"
            style={{ fontSize: "clamp(48px, 8vw, 120px)", letterSpacing: "-0.015em" }}
          >
            Palestrantes
            <br />
            <em style={{ color: "var(--red)" }}>convidados</em>
          </h1>
        </div>
        <div className="max-w-[400px]">
          <p className="text-[15px] leading-[1.7]" style={{ color: "var(--muted)" }}>
            Profissionais e pesquisadores reunidos pela Comissão Lina Bo Bardi para as quatro noites do SAUU + SEC 2026.
          </p>
          {isPlaceholder && (
            <p className="mt-3 text-[10px] uppercase tracking-[0.28em]" style={{ color: "var(--muted)" }}>
              Prévia — confirmações em breve
            </p>
          )}
          <Link
            href="/programacao"
            className="mt-5 inline-block border-b border-current pb-1 text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:text-accent"
          >
            Ver programação →
          </Link>
        </div>
      </div>

      {/* ── GRID ── */}
      <div
        className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
        style={{ background: "var(--line)", border: "1px solid var(--line)" }}
      >
        {speakers.map((s, i) => (
          <div
            key={s.speaker}
            className="group flex flex-col"
            style={{ background: "var(--paper)", opacity: isPlaceholder ? 0.78 : 1 }}
          >
            {/* Portrait */}
            <div
              className="relative overflow-hidden"
              style={{ aspectRatio: "3/4", background: "var(--surface)" }}
            >
              {s.imageUrl ? (
                <Image
                  src={s.imageUrl}
                  alt={s.speaker}
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span
                    className="font-display leading-none"
                    style={{ fontSize: "clamp(80px, 10vw, 120px)", color: "var(--line)" }}
                  >
                    {s.speaker.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Number badge */}
              <div
                className="absolute left-0 top-0 px-3 py-2 font-display text-[11px] leading-none"
                style={{ background: "var(--red)", color: "var(--bg)", letterSpacing: "0.04em" }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-6">
              {/* Day + slot */}
              <div className="mb-2 flex flex-wrap gap-x-2 gap-y-0.5">
                {s.talks.map((t) => (
                  <span
                    key={t.id}
                    className="text-[10px] uppercase tracking-[0.24em]"
                    style={{ color: "var(--red)" }}
                  >
                    Dia {t.day} · {t.slot}
                  </span>
                ))}
              </div>

              {/* Name */}
              <h2 className="mb-2 font-display text-[22px] leading-[1.05] text-primary">
                {s.speaker}
              </h2>

              {/* Talk title */}
              {s.talks.map((t) => (
                <p key={t.id} className="mb-3 text-[12px] leading-[1.5]" style={{ color: "var(--muted)" }}>
                  {t.title}
                </p>
              ))}

              {/* Bio */}
              {s.bio && (
                <p className="mt-auto border-t pt-4 text-[12px] leading-[1.65]" style={{ color: "var(--muted)", borderColor: "var(--line-soft)" }}>
                  {s.bio}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <div
        className="mt-px grid grid-cols-1 items-center gap-8 px-10 py-12 md:grid-cols-[1fr_auto]"
        style={{ background: "var(--ink)", color: "var(--bg)" }}
      >
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.3em]" style={{ color: "rgba(227,226,222,0.5)" }}>
            SAUU + SEC 2026 · Unifil Londrina
          </div>
          <p className="font-display text-[22px] leading-tight">
            17 a 21 de agosto — garanta sua vaga.
          </p>
        </div>
        <Link
          href="/cadastro"
          className="inline-flex items-center gap-2.5 whitespace-nowrap px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] transition-all hover:-translate-y-px"
          style={{ background: "var(--red)", color: "var(--bg)" }}
        >
          Inscrever-se <span>→</span>
        </Link>
      </div>

    </main>
  );
}
