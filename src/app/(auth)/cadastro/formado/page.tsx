import Link from "next/link";
import { CadastroFormadoForm } from "@/components/forms/CadastroFormadoForm";

export default function CadastroFormadoPage() {
  return (
    <div>
      <Link
        href="/cadastro"
        className="mb-8 flex w-fit items-center gap-1.5 text-[12px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
      >
        ← Voltar
      </Link>

      <div className="mb-9">
        <div
          className="mb-3.5 text-[11px] uppercase tracking-[0.24em]"
          style={{ color: "var(--red)" }}
        >
          Profissional Formado
        </div>
        <h2
          className="mb-2 font-display leading-none"
          style={{ fontSize: "42px" }}
        >
          Criar conta
        </h2>
        <p className="text-[14px] text-muted">
          Preencha seus dados de formação.
        </p>
      </div>

      <CadastroFormadoForm />

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
    </div>
  );
}
