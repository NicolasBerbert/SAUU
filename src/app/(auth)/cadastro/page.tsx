import Link from "next/link";

const tipos = [
  {
    href: "/cadastro/unifil",
    label: "Aluno Unifil",
    description: "E-mail institucional @edu.unifil.br",
    tag: "Unifil",
  },
  {
    href: "/cadastro/uel",
    label: "Instituição Externa",
    description: "Estudante de outra faculdade de Arquitetura, Urbanismo ou Eng. Civil",
    tag: "Externo",
  },
  {
    href: "/cadastro/formado",
    label: "Profissional Formado",
    description: "Já graduado em Arquitetura, Urbanismo, Engenharia ou áreas afins",
    tag: "Formado",
  },
];

export default function CadastroPage() {
  return (
    <div>
      <div className="mb-8">
        <div
          className="mb-3.5 text-[11px] uppercase tracking-[0.24em]"
          style={{ color: "var(--red)" }}
        >
          Cadastro
        </div>
        <h2
          className="mb-2 font-display leading-none"
          style={{ fontSize: "42px" }}
        >
          Criar conta
        </h2>
        <p className="text-[14px] text-muted">Selecione seu perfil para continuar.</p>
      </div>

      {/* Role picker */}
      <div className="flex flex-col gap-px" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
        {tipos.map((tipo) => (
          <Link
            key={tipo.href}
            href={tipo.href}
            className="group flex items-center justify-between px-5 py-5 transition-all"
            style={{ background: "var(--paper)" }}
            onMouseEnter={() => {}}
          >
            <div className="role-info">
              <b
                className="mb-1 block font-display text-[22px] font-normal leading-none text-primary"
              >
                {tipo.label}
              </b>
              <span className="text-[13px] text-muted">{tipo.description}</span>
            </div>
            <span
              className="ml-4 shrink-0 text-[22px] transition-transform group-hover:translate-x-1.5"
              style={{ color: "var(--red)" }}
            >
              →
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-[13px] text-muted">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="border-b border-current pb-0.5 transition-colors hover:text-accent"
          style={{ color: "var(--red)" }}
        >
          Entrar
        </Link>
      </p>

      <div
        className="mt-8 border-t pt-6 text-center"
        style={{ borderColor: "var(--line-soft)" }}
      >
        <p className="mb-2 text-[12px] text-muted">
          Quer ver as palestras antes de se inscrever?
        </p>
        <Link
          href="/programacao"
          className="border-b border-current pb-0.5 text-[12px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
        >
          Ver programação completa
        </Link>
      </div>
    </div>
  );
}
