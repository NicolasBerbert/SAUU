import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ cadastro?: string; erro?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <div className="w-full max-w-md">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">Acesso</span>
        </div>
        <h1 className="text-3xl font-light text-primary mb-2">Entrar</h1>
        <p className="text-sm text-muted">
          Acesse sua conta para gerenciar suas inscrições.
        </p>
      </div>

      {params.cadastro === "sucesso" && (
        <div className="mb-6 text-xs text-success border border-success/20 bg-success/5 px-4 py-3">
          Conta criada com sucesso! Faça login para continuar.
        </div>
      )}

      {params.erro === "acesso_negado" && (
        <div className="mb-6 text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">
          Acesso negado. Faça login para continuar.
        </div>
      )}

      <LoginForm />

      <p className="mt-8 text-center text-xs text-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-accent hover:text-accent-light transition-colors">
          Cadastrar-se
        </Link>
      </p>
    </div>
  );
}
