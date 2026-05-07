import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ cadastro?: string; erro?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <div>
      <div className="mb-9">
        <div
          className="mb-3.5 text-[11px] uppercase tracking-[0.24em]"
          style={{ color: "var(--red)" }}
        >
          Login
        </div>
        <h2
          className="mb-2 font-display leading-none"
          style={{ fontSize: "42px" }}
        >
          Bem-vinda
          <br />
          de volta
        </h2>
        <p className="text-[14px] text-muted">
          Acesse sua conta para gerenciar suas inscrições.
        </p>
      </div>

      {params.cadastro === "sucesso" && (
        <div
          className="mb-6 px-4 py-3 text-[12px]"
          style={{
            color: "var(--sage)",
            border: "1px solid var(--sage)",
            background: "rgba(140,150,115,0.08)",
          }}
        >
          Conta criada com sucesso! Faça login para continuar.
        </div>
      )}

      {params.erro === "acesso_negado" && (
        <div
          className="mb-6 px-4 py-3 text-[12px]"
          style={{
            color: "var(--red)",
            border: "1px solid var(--red)",
            background: "rgba(167,62,47,0.06)",
          }}
        >
          Acesso negado. Faça login para continuar.
        </div>
      )}

      <LoginForm />

      <p className="mt-8 text-center text-[13px] text-muted">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="border-b border-current pb-0.5 transition-colors hover:text-accent"
          style={{ color: "var(--red)" }}
        >
          Cadastrar-se
        </Link>
      </p>
    </div>
  );
}
