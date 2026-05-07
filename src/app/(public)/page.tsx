import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const pillars = [
    { num: "01", t: "Projeto", d: "Processo criativo, método e prática projetual em arquitetura e urbanismo." },
    { num: "02", t: "Técnica", d: "Sistemas construtivos, estruturas e materialidade na engenharia civil." },
    { num: "03", t: "Território", d: "Cidade, paisagem e as escalas do espaço construído e habitado." },
    { num: "04", t: "Encontro", d: "Diálogo entre estudantes, profissionais e pesquisadores da área." },
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
                <span className="eyebrow">Edição 2026 · 15 a 19 de setembro</span>
              </div>

              <h1
                className="font-display leading-[0.88] text-primary"
                style={{
                  fontSize: "clamp(64px, 11vw, 168px)",
                  letterSpacing: "-0.015em",
                }}
              >
                Semana
                <br />
                <span style={{ color: "var(--red)", fontStyle: "italic" }}>CLBB</span>
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
                Cinco noites de palestras, debates e encontros sobre{" "}
                <em>Arquitetura, Urbanismo e Engenharia Civil</em>. Organizado
                pela Comissão Lina Bo Bardi — estudantes da Unifil Londrina.
              </p>

              <div className="mt-9 flex flex-wrap gap-3.5">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2.5 border border-transparent px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] text-background transition-all hover:bg-accent-dark hover:-translate-y-px"
                  style={{ background: "var(--red)" }}
                >
                  Inscrever-se <span>→</span>
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
                className="relative overflow-hidden"
                style={{
                  width: "280px",
                  aspectRatio: "320/240",
                  animation: "floaty 8s ease-in-out infinite",
                  filter: "drop-shadow(0 18px 36px rgba(50,49,47,0.18))",
                }}
              >
                <Image
                  src="/lina-portrait.png"
                  alt="Lina Bo Bardi"
                  fill
                  className="object-cover"
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
            }}
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <defs>
                <path
                  id="circ"
                  d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                />
              </defs>
              <text
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  letterSpacing: "0.24em",
                  fill: "var(--red)",
                  textTransform: "uppercase",
                }}
              >
                <textPath href="#circ">EDIÇÃO 2026 · CLBB · UNIFIL · LONDRINA · </textPath>
              </text>
            </svg>
          </div>

          {/* Scroll cue */}
          <div
            className="absolute bottom-12 left-0 flex flex-col items-start gap-3.5"
            style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--muted)" }}
          >
            <span>Role</span>
            <span
              className="block w-px"
              style={{
                height: "46px",
                background: "linear-gradient(to bottom, var(--red), transparent)",
                animation: "dropline 2.4s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── NUMBERS ── */}
      <div className="mx-auto max-w-[1320px] px-8">
        <div
          className="grid grid-cols-2 gap-px sm:grid-cols-4"
          style={{ background: "var(--line)", border: "1px solid var(--line)" }}
        >
          {[
            { n: "5", l: "noites de evento" },
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
            <p className="self-end text-[17px] leading-[1.65] text-primary md:max-w-[620px]">
              A CLBB — Comissão Lina Bo Bardi — é formada por estudantes dos
              cursos de Arquitetura e Urbanismo e de Engenharia Civil da Unifil.
              Em cinco noites, abrimos o auditório para o encontro entre quem
              projeta, quem constrói e quem está aprendendo a transformar a
              cidade.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-20 md:grid-cols-[1.2fr_1fr]">
            <div>
              {/* Meta grid */}
              <div
                className="grid grid-cols-2 gap-px"
                style={{ background: "var(--line)", border: "1px solid var(--line)" }}
              >
                {[
                  { k: "Duração", v: "5 dias" },
                  { k: "Datas", v: "15–19 set" },
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
                Arquitetura é uma <em>aventura</em>: um chamamento à vida.
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
                Nascemos da vontade de fazer um evento à altura dos cursos e da
                cidade. Inspirados pela arquiteta ítalo-brasileira que entendeu o
                popular como matéria de projeto, construímos uma programação que
                cruza projeto, técnica e território.
              </p>
              <p className="text-[16px] leading-[1.7] text-muted">
                Não cobramos do público que apenas assista — convidamos a
                participar das mesas, a opinar nos debates, a frequentar o saguão
                entre uma palestra e outra. A CLBB é, antes de tudo, um espaço
                público temporário.
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
              <em style={{ color: "var(--paper-2)" }}>nas cinco noites.</em>
            </h3>
            <p className="max-w-[480px] text-[15px] opacity-85">
              Inscrição única dá acesso a toda a programação, com seleção de
              palestras após confirmação do pagamento. Vagas limitadas no
              auditório.
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-[96px] leading-none">R$50</div>
            <div
              className="mt-1.5 text-[11px] uppercase tracking-[0.28em]"
              style={{ opacity: 0.75 }}
            >
              inscrição completa
            </div>
            <Link
              href="/cadastro"
              className="mt-6 inline-flex items-center gap-2.5 px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] transition-all hover:-translate-y-px"
              style={{ background: "var(--bg)", color: "var(--red)" }}
            >
              Inscrever-se agora <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
