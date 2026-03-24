import Link from "next/link";

const tipos = [
  {
    href: "/cadastro/unifil",
    label: "Aluno Unifil",
    description: "Possuo e-mail institucional @edu.unifil.br",
    tag: "Unifil",
  },
  {
    href: "/cadastro/uel",
    label: "Instituição Externa",
    description: "Sou estudante de outra faculdade de arquitetura (não Unifil)",
    tag: "Externo",
  },
  {
    href: "/cadastro/formado",
    label: "Profissional Formado",
    description: "Já sou graduado em Arquitetura ou área relacionada",
    tag: "Formado",
  },
];

export default function CadastroPage() {
  return (
    <div className="w-full max-w-lg">
      {/* Título */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">Cadastro</span>
        </div>
        <h1 className="text-3xl font-light text-primary mb-2">Criar conta</h1>
        <p className="text-sm text-muted">
          Selecione seu perfil para continuar.
        </p>
      </div>

      {/* Cards de tipo */}
      <div className="flex flex-col gap-px bg-border">
        {tipos.map((tipo) => (
          <Link
            key={tipo.href}
            href={tipo.href}
            className="group flex items-center justify-between bg-surface p-6 hover:bg-surface-2 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-primary mb-1">{tipo.label}</p>
              <p className="text-xs text-muted">{tipo.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-muted border border-border px-2 py-1 hidden sm:block">
                {tipo.tag}
              </span>
              <svg
                className="h-4 w-4 text-muted group-hover:text-accent transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-accent hover:text-accent-light transition-colors">
          Entrar
        </Link>
      </p>

      <div className="mt-6 border-t border-border pt-6 text-center">
        <p className="text-xs text-muted mb-2">Quer ver as palestras antes de se inscrever?</p>
        <Link
          href="/programacao"
          className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors underline underline-offset-4"
        >
          Ver programação completa
        </Link>
      </div>
    </div>
  );
}
