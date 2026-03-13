import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center border-b border-border">
        {/* Grid decorativo de fundo */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#c8a96e 1px, transparent 1px), linear-gradient(90deg, #c8a96e 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="flex items-center gap-3 mb-10">
              <div className="h-px w-12 bg-accent" />
              <span className="text-xs uppercase tracking-[0.3em] text-accent">
                Unifil — Curso de Arquitetura e Urbanismo
              </span>
            </div>

            {/* Título */}
            <h1 className="text-5xl sm:text-7xl font-light text-primary leading-none tracking-tight mb-6">
              Semana de
              <br />
              <span className="text-accent">Arquitetura</span>
              <br />
              Unifil
            </h1>

            <p className="text-base text-muted max-w-lg leading-relaxed mb-12">
              Cinco dias de palestras, debates e troca de experiências com
              profissionais e pesquisadores da área de arquitetura e urbanismo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/cadastro">
                <Button variant="primary" className="w-full sm:w-auto px-10 py-4 text-xs tracking-widest uppercase">
                  Inscrever-se
                </Button>
              </Link>
              <Link href="/programacao">
                <Button variant="secondary" className="w-full sm:w-auto px-10 py-4 text-xs tracking-widest uppercase">
                  Ver Programação
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Informações rápidas */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
          {[
            { label: "Duração", value: "5 dias" },
            { label: "Palestras", value: "10 apresentações" },
            { label: "Local", value: "Unifil — Londrina, PR" },
          ].map((item) => (
            <div key={item.label} className="bg-background p-10">
              <p className="text-xs uppercase tracking-widest text-muted mb-3">
                {item.label}
              </p>
              <p className="text-2xl font-light text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
