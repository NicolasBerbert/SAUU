import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  let hasPaidRegistration = false;
  if (session?.user?.id) {
    const registration = await prisma.eventRegistration.findUnique({
      where: { userId: session.user.id },
      select: { paymentStatus: true },
    });
    hasPaidRegistration = registration?.paymentStatus === "APPROVED";
  }

  // Featured speakers for home page
  const rawSpeakers = await prisma.presentation.findMany({
    where: { active: true },
    orderBy: [{ day: "asc" }, { slot: "asc" }],
    select: { id: true, title: true, speaker: true, imageUrl: true, day: true, slot: true },
  });
  const seenNames = new Set<string>();
  const featuredSpeakers: typeof rawSpeakers = [];
  for (const p of rawSpeakers) {
    if (!seenNames.has(p.speaker) && featuredSpeakers.length < 4) {
      seenNames.add(p.speaker);
      featuredSpeakers.push(p);
    }
  }

  // CTA button config based on auth/payment state
  const ctaHref = !session ? "/cadastro" : hasPaidRegistration ? "/minhas-palestras" : "/minhas-palestras";
  const ctaLabel = !session ? "Inscrever-se" : hasPaidRegistration ? "Minhas palestras" : "Fazer inscrição";
  const ctaLabelLong = !session ? "Inscrever-se agora" : hasPaidRegistration ? "Ver minhas palestras" : "Fazer inscrição agora";

  const pillars = [
    { num: "01", t: "Saber teórico", d: "O conhecimento acadêmico valioso é o primeiro passo de qualquer grande jornada profissional, por isso convidamos você a participar de trocas que reconhecem a importância da teoria." },
    { num: "02", t: "Prática", d: "Fundamentalmente, os saberes da arquitetura e da engenharia civil exigem aplicações práticas desde o princípio do aprendizado. Juntas, a SAUU e SEC querem enriquecer suas capacidades práticas e aumentar sua confiança projetual." },
    { num: "03", t: "Mercado", d: "Reconhecemos a importância da parceria de empresas que viabilizam a construção civil, e valorizamos o conhecimento profissional agregado por quem já pratica Arquitetura e Engenharia. Queremos oferecer um ambiente em que esses saberes enriquecem a academia." },
    { num: "04", t: "Território", d: "Valorizamos a localidade e temos orgulho em ser Unifil, Londrina! Por isso, a CLBB se orgulha em representar e protagonizar profissionais locais." },
  ];

  return (
    <main>
      {/* ── HERO ── */}
      <section
        className="relative flex min-h-[92vh] items-center px-8"
        style={{ maxWidth: "1320px", margin: "0 auto" }}
      >
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)",
            backgroundSize: "88px 88px",
            maskImage: "radial-gradient(ellipse at 70% 40%, #000 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at 70% 40%, #000 30%, transparent 75%)",
          }}
        />

        <div className="relative w-full">
          <div className="grid grid-cols-1 items-end gap-10 md:grid-cols-[1fr_auto]">
            {/* Left */}
            <div className="max-w-[780px]">
              <div className="mb-9 flex items-center gap-3.5">
                <span className="h-px w-12" style={{ background: "var(--red)" }} />
                <span className="eyebrow">Edição 2026 · 17 a 21 de agosto</span>
              </div>

              <h1
                className="font-display leading-[0.88] text-primary"
                style={{
                  fontSize: "clamp(64px, 11vw, 168px)",
                  letterSpacing: "-0.015em",
                }}
              >
                SAUU
                <br />
                <span style={{ color: "var(--red)", fontStyle: "italic" }}>+ SEC</span>
                <br />
                <span
                  style={{
                    WebkitTextStroke: "1.5px var(--ink)",
                    color: "transparent",
                  }}
                >
                  2026
                </span>
              </h1>

              <p
                className="mt-8 max-w-[520px] text-[17px] leading-[1.55] text-primary"
              >
                Quatro noites de palestras, debates e encontros sobre{" "}
                <em>Arquitetura, Urbanismo e Engenharia Civil</em>. Organizado
                pela Comissão Lina Bo Bardi — estudantes da Unifil Londrina.
              </p>

              <div className="mt-9 flex flex-wrap gap-3.5">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2.5 border border-transparent px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] text-background transition-all hover:bg-accent-dark hover:-translate-y-px"
                  style={{ background: "var(--red)" }}
                >
                  {ctaLabel} <span>→</span>
                </Link>
                <Link
                  href="/programacao"
                  className="inline-flex items-center border border-border px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] text-primary transition-all hover:border-accent hover:text-accent"
                >
                  Ver programação
                </Link>
              </div>
            </div>

            {/* Right — portrait */}
            <div className="hidden flex-col items-end gap-8 md:flex">
              <div
                style={{
                  width: "280px",
                  height: "340px",
                  position: "relative",
                  animation: "floaty 8s ease-in-out infinite",
                  filter: "drop-shadow(0 18px 36px rgba(50,49,47,0.22))",
                }}
              >
                <Image
                  src="/lina-portrait.png"
                  alt="Lina Bo Bardi"
                  fill
                  className="object-contain object-bottom"
                />
              </div>
              <div className="text-right">
                <div className="label-text mb-1.5">Em homenagem a</div>
                <div
                  className="font-display leading-none"
                  style={{ fontSize: "32px", color: "var(--red)" }}
                >
                  Lina Bo Bardi
                </div>
                <div className="mt-1.5 text-[12px] text-muted">1914 — 1992</div>
              </div>
            </div>
          </div>

          {/* Circular text deco */}
          <div
            className="pointer-events-none absolute right-[6%] top-[18%] hidden lg:block"
            style={{
              width: "140px",
              height: "140px",
              border: "1px solid var(--red)",
              borderRadius: "50%",
              animation: "spin 28s linear infinite",
              overflow: "visible",
            }}
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: "visible" }}>
              <defs>
                <path
                  id="circText"
                  d="M 50,12 a 38,38 0 1,1 -0.001,0"
                />
              </defs>
              <text
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  fill: "var(--red)",
                  textTransform: "uppercase",
                }}
              >
                <textPath href="#circText" textLength="185" lengthAdjust="spacing">
                  EDIÇÃO 2026 · CLBB · UNIFIL ·
                </textPath>
              </text>
            </svg>
          </div>

        </div>

        {/* Scroll cue — anchored to the 92vh hero section bottom */}
        <div
          className="absolute bottom-12 left-8 flex flex-col items-start gap-3.5"
          style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--muted)" }}
        >
          <span
            className="block w-px"
            style={{
              height: "46px",
              background: "linear-gradient(to bottom, var(--red), transparent)",
              animation: "dropline 2.4s ease-in-out infinite",
            }}
          />
        </div>
      </section>

      {/* ── NUMBERS ── */}
      <div className="mx-auto max-w-[1320px] px-8 mt-20">
        <div
          className="grid grid-cols-2 gap-px sm:grid-cols-4"
          style={{ background: "var(--line)", border: "1px solid var(--line)" }}
        >
          {[
            { n: "4", l: "noites de evento" },
            { n: "10", l: "palestras" },
            { n: "8", l: "convidados" },
            { n: "600+", l: "vagas no auditório" },
          ].map((item) => (
            <div
              key={item.l}
              className="flex min-h-[220px] flex-col justify-end gap-3 px-9 py-14"
              style={{ background: "var(--bg)" }}
            >
              <div
                className="font-display leading-[0.9]"
                style={{ fontSize: "clamp(56px, 7vw, 96px)", color: "var(--red)" }}
              >
                {item.n}
              </div>
              <div
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: "var(--muted)" }}
              >
                {item.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SPONSORS ── */}
      <div
        className="mt-16 overflow-hidden border-y"
        style={{ borderColor: "var(--line-soft)" }}
      >
        <div
          style={{
            display: "flex",
            width: "max-content",
            animation: "marquee 28s linear infinite",
            paddingBlock: "18px",
          }}
        >
          {[
            "Unifil", "SEC 2026", "SAUU", "Comissão Lina Bo Bardi",
            "Arquitetura e Urbanismo", "Engenharia Civil", "Londrina", "CLBB",
            "Unifil", "SEC 2026", "SAUU", "Comissão Lina Bo Bardi",
            "Arquitetura e Urbanismo", "Engenharia Civil", "Londrina", "CLBB",
          ].map((name, i) => (
            <span
              key={i}
              className="flex items-center"
              style={{ paddingInline: "36px" }}
            >
              <span
                className="font-display text-[20px] whitespace-nowrap"
                style={{ color: "var(--ink)", opacity: 0.38, letterSpacing: "0.04em" }}
              >
                {name}
              </span>
              <span
                style={{ marginLeft: "36px", color: "var(--red)", opacity: 0.35, fontSize: "10px" }}
              >
                ◆
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section
        className="border-y"
        style={{ background: "var(--paper)", borderColor: "var(--line-soft)" }}
      >
        <div className="mx-auto max-w-[1320px] px-8 py-[120px]">
          <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="mb-4 flex items-center gap-3.5">
                <span className="h-px w-8" style={{ background: "var(--red)" }} />
                <span className="eyebrow">O evento</span>
              </div>
              <h2
                className="font-display leading-[0.96] text-primary"
                style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}
              >
                Uma semana
                <br />
                <em style={{ color: "var(--red)" }}>para pensar</em>
                <br />
                cidade e projeto
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-20 md:grid-cols-[1.2fr_1fr]">
            <div>
              {/* Meta grid */}
              <div
                className="grid grid-cols-2 gap-px"
                style={{ background: "var(--line)", border: "1px solid var(--line)" }}
              >
                {[
                  { k: "Duração", v: "4 noites" },
                  { k: "Datas", v: "17–21 ago" },
                  { k: "Local", v: "Unifil" },
                  { k: "Público", v: "Aberto" },
                ].map(({ k, v }) => (
                  <div
                    key={k}
                    className="px-7 py-7"
                    style={{ background: "var(--paper)" }}
                  >
                    <div
                      className="mb-2.5 text-[10px] uppercase tracking-[0.3em]"
                      style={{ color: "var(--muted)" }}
                    >
                      {k}
                    </div>
                    <div
                      className="font-display text-[28px]"
                      style={{ color: "var(--ink)" }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quote */}
              <blockquote
                className="mt-8 pl-5"
                style={{
                  borderLeft: "2px solid var(--red)",
                  fontFamily: "var(--font-display)",
                  fontSize: "24px",
                  lineHeight: "1.25",
                }}
              >
                Não é preciso <em>muito</em> para ser muito.
                <span
                  className="mt-2.5 block font-sans text-[11px] uppercase tracking-[0.28em]"
                  style={{ color: "var(--muted)" }}
                >
                  — Lina Bo Bardi
                </span>
              </blockquote>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-[16px] leading-[1.7]">
                Nossa motivação é promover a conexão real do saber acadêmico com o mercado de trabalho, construindo uma programação que intersecciona a prática e o conhecimento teórico. Esse ano com contribuições maiores do que nunca de profissionais ainda mais diversos. O objetivo da Comissão Lina Bo Bardi é garantir que sua experiência valha a pena!
              </p>
              <Link
                href="/programacao"
                className="self-start border-b border-current pb-1 text-[12px] uppercase tracking-[0.2em] text-primary transition-colors hover:text-accent"
              >
                Ver programação completa →
              </Link>
            </div>
          </div>

          {/* Pillars */}
          <div
            className="mt-16 grid grid-cols-2 gap-px sm:grid-cols-4"
            style={{ background: "var(--line)", border: "1px solid var(--line)" }}
          >
            {pillars.map((p) => (
              <div
                key={p.num}
                className="bg-surface px-6 py-8 transition-colors hover:bg-background"
              >
                <div
                  className="mb-4 font-display text-[36px] leading-none"
                  style={{ color: "var(--red)" }}
                >
                  {p.num}
                </div>
                <h4 className="mb-2 text-[14px] tracking-[0.04em]">{p.t}</h4>
                <p className="text-[13px] leading-[1.55] text-muted">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONVIDADOS DA SEMANA ── */}
      <section className="mx-auto max-w-[1320px] px-8 py-[100px]">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3.5">
              <span className="h-px w-8" style={{ background: "var(--red)" }} />
              <span className="eyebrow">Convidados da semana</span>
            </div>
            <h2
              className="font-display leading-[0.96] text-primary"
              style={{ fontSize: "clamp(36px, 5vw, 60px)" }}
            >
              Quem vai
              <br />
              <em style={{ color: "var(--red)" }}>palestrar</em>
            </h2>
          </div>
          <Link
            href="/palestrantes"
            className="hidden border-b border-current pb-1 text-[12px] uppercase tracking-[0.2em] text-primary transition-colors hover:text-accent md:block"
          >
            Ver todos →
          </Link>
        </div>

        {featuredSpeakers.length > 0 ? (
          <div
            className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
            style={{ background: "var(--line)", border: "1px solid var(--line)" }}
          >
            {featuredSpeakers.map((s) => (
              <div key={s.id} className="flex flex-col" style={{ background: "var(--paper)" }}>
                <div
                  className="relative overflow-hidden"
                  style={{ aspectRatio: "3/4", background: "var(--surface)" }}
                >
                  {s.imageUrl ? (
                    <Image src={s.imageUrl} alt={s.speaker} fill className="object-cover object-top" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-[64px] leading-none" style={{ color: "var(--line)" }}>
                        {s.speaker.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div
                    className="mb-1 text-[10px] uppercase tracking-[0.24em]"
                    style={{ color: "var(--red)" }}
                  >
                    Dia {s.day} · {s.slot}
                  </div>
                  <div className="font-display text-[20px] leading-tight text-primary">{s.speaker}</div>
                  <div className="mt-1.5 text-[12px] text-muted">{s.title}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
            style={{ background: "var(--line)", border: "1px solid var(--line)" }}
          >
            {[
              { name: "Ana Carolina Duarte", label: "Dia 1 · 19:00", talk: "Habitação como direito: experiências em HIS no Brasil", img: "https://i.pravatar.cc/400?img=47" },
              { name: "Rodrigo Menezes", label: "Dia 1 · 20:45", talk: "Estruturas metálicas: do projeto à montagem", img: "https://i.pravatar.cc/400?img=12" },
              { name: "Fernanda Lopes", label: "Dia 2 · 19:00", talk: "Modernismo e identidade: revisitando o legado de Niemeyer", img: "https://i.pravatar.cc/400?img=44" },
              { name: "Paulo Saraiva", label: "Dia 2 · 20:45", talk: "Bioclimatismo e materialidade: construir com o lugar", img: "https://i.pravatar.cc/400?img=15" },
            ].map((s) => (
              <div key={s.name} className="flex flex-col" style={{ background: "var(--paper)", opacity: 0.72 }}>
                <div className="relative overflow-hidden" style={{ aspectRatio: "3/4", background: "var(--surface)" }}>
                  <Image src={s.img} alt={s.name} fill className="object-cover object-top" />
                </div>
                <div className="p-6">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--red)" }}>
                    {s.label}
                  </div>
                  <div className="font-display text-[20px] leading-tight text-primary">{s.name}</div>
                  <div className="mt-1.5 text-[12px] text-muted">{s.talk}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-[1320px] px-8 pb-[120px] pt-0">
        <div
          className="grid grid-cols-1 items-center gap-10 px-16 py-20 md:grid-cols-[1.4fr_1fr]"
          style={{ background: "var(--red)", color: "var(--bg)" }}
        >
          <div>
            <div
              className="mb-4 text-[11px] uppercase tracking-[0.28em]"
              style={{ color: "rgba(227,226,222,0.7)" }}
            >
              Inscrição
            </div>
            <h3
              className="mb-4 font-display leading-none"
              style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
            >
              Garanta sua vaga
              <br />
              <em style={{ color: "var(--paper-2)" }}>nas quatro noites.</em>
            </h3>
            <p className="max-w-[480px] text-[15px] opacity-85">
              Inscrição única dá acesso às quatro noites, com seleção de
              palestras após confirmação do pagamento. Vagas limitadas no
              auditório.
            </p>
          </div>
          <div className="text-right">
            {!hasPaidRegistration && (
              <>
                <div className="font-display text-[96px] leading-none">R$50</div>
                <div
                  className="mt-1.5 text-[11px] uppercase tracking-[0.28em]"
                  style={{ opacity: 0.75 }}
                >
                  inscrição completa
                </div>
              </>
            )}
            {hasPaidRegistration && (
              <div
                className="mb-4 text-[11px] uppercase tracking-[0.28em]"
                style={{ opacity: 0.75 }}
              >
                Inscrição confirmada ✓
              </div>
            )}
            <Link
              href={ctaHref}
              className="mt-6 inline-flex items-center gap-2.5 px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] transition-all hover:-translate-y-px"
              style={{ background: "var(--bg)", color: "var(--red)" }}
            >
              {ctaLabelLong} <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
