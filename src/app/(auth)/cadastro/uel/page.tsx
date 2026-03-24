import Link from "next/link";
import { CadastroUELForm } from "@/components/forms/CadastroUELForm";

export default function CadastroUELPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-10">
        <Link
          href="/cadastro"
          className="flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors mb-8 w-fit"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">Instituição Externa</span>
        </div>
        <h1 className="text-3xl font-light text-primary mb-2">Criar conta</h1>
        <p className="text-sm text-muted">
          Informe seu Registro Acadêmico da sua instituição.
        </p>
      </div>

      <CadastroUELForm />

      <p className="mt-8 text-center text-xs text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-accent hover:text-accent-light transition-colors">
          Entrar
        </Link>
      </p>
    </div>
  );
}
