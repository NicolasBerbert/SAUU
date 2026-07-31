import { prisma } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OEventoPage() {
  const members = await prisma.comissaoMember.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="mx-auto max-w-[1320px] px-8 py-[140px]">

      {/* ── PAGE HEADER ── */}
      <div className="mb-20 grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="mb-4 flex items-center gap-3.5">
            <span className="h-px w-8" style={{ background: "var(--red)" }} />
            <span className="eyebrow">CLBB 2026</span>
          </div>
          <h1
            className="font-display leading-[0.96] text-primary"
            style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}
          >
            O Evento
            <br />
            <em style={{ color: "var(--red)" }}>nossa história</em>
          </h1>
        </div>
        <p className="self-end text-[17px] leading-[1.65] text-primary">
          O SAUU + SEC 2026 é o encontro anual de estudantes de Arquitetura e
          Engenharia Civil da Unifil Londrina, organizado pela Comissão Lina Bo
          Bardi — um grupo de alunos comprometidos em aproximar o saber
          acadêmico da prática profissional.
        </p>
      </div>

      {/* ── BLOCKQUOTE ── */}
      <div
        className="mb-20 flex flex-col items-center px-4 py-20 text-center"
        style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}
      >
        <blockquote
          className="font-display italic leading-[1.05] text-primary"
          style={{ fontSize: "clamp(48px, 8vw, 96px)", maxWidth: "1000px" }}
        >
          &ldquo;Não é preciso muito para ser muito.&rdquo;
        </blockquote>
        <p
          className="mt-8 text-[11px] uppercase tracking-[0.28em]"
          style={{ color: "var(--muted)" }}
        >
          — Lina Bo Bardi, 1914–1992
        </p>
      </div>

      {/* ── A COMISSÃO ── */}
      {members.length > 0 && (
        <section className="mb-20">
          <div className="mb-10">
            <div className="mb-3 flex items-center gap-3.5">
              <span className="h-px w-8" style={{ background: "var(--red)" }} />
              <span className="eyebrow">Quem faz acontecer</span>
            </div>
            <h2
              className="font-display leading-[0.96] text-primary"
              style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
            >
              A Comissão
            </h2>
          </div>

          <div
            className="grid gap-px sm:grid-cols-2 lg:grid-cols-3"
            style={{ background: "var(--line)", border: "1px solid var(--line)" }}
          >
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col"
                style={{ background: "var(--paper)" }}
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: "1 / 1", background: "var(--surface)" }}
                >
                  {member.imageUrl ? (
                    <Image
                      src={member.imageUrl}
                      alt={member.name}
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span
                        className="font-display leading-none"
                        style={{ fontSize: "clamp(64px, 8vw, 96px)", color: "var(--line)" }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="mb-2 font-display text-[20px] leading-none text-primary">
                    {member.name}
                  </h3>
                  {member.role && (
                    <p
                      className="text-[10px] uppercase tracking-[0.22em]"
                      style={{ color: "var(--muted)" }}
                    >
                      {member.role}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── NOSSA MISSÃO ── */}
      <section className="mb-20">
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-3.5">
            <span className="h-px w-8" style={{ background: "var(--red)" }} />
            <span className="eyebrow">Por que existimos</span>
          </div>
          <h2
            className="font-display leading-[0.96] text-primary"
            style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
          >
            Nossa missão
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <p className="text-[17px] leading-[1.75]">
            Nossa motivação é promover a conexão real do saber acadêmico com o
            mercado de trabalho, construindo uma programação que intersecciona a
            prática e o conhecimento teórico.
          </p>
          <p className="text-[17px] leading-[1.75]" style={{ color: "var(--muted)" }}>
            Inspirados pela arquiteta Lina Bo Bardi — que via no popular a
            matéria de todo projeto — a Comissão Lina Bo Bardi existe para que o
            conhecimento não fique preso dentro da sala de aula.
          </p>
        </div>
      </section>

      {/* ── BOTTOM INFO STRIP ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-6 px-10 py-10"
        style={{ background: "var(--ink)" }}
      >
        <div className="flex flex-col gap-3">
          <span
            className="font-display text-[26px] leading-none"
            style={{ color: "var(--bg)" }}
          >
            SAUU + SEC 2026
          </span>
          <div className="flex flex-wrap items-center gap-5">
            <span
              className="text-[11px] uppercase tracking-[0.24em]"
              style={{ color: "rgba(227,226,222,0.5)" }}
            >
              17 a 21 de agosto
            </span>
            <span className="h-px w-4" style={{ background: "rgba(227,226,222,0.2)" }} />
            <span
              className="text-[11px] uppercase tracking-[0.24em]"
              style={{ color: "rgba(227,226,222,0.5)" }}
            >
              Unifil · Londrina, PR
            </span>
          </div>
        </div>
        <Link
          href="/programacao"
          className="inline-flex items-center gap-2.5 px-[22px] py-[14px] text-[11px] uppercase tracking-[0.24em] transition-all hover:-translate-y-px"
          style={{ background: "var(--red)", color: "var(--bg)" }}
        >
          Ver programação <span>→</span>
        </Link>
      </div>

    </main>
  );
}
