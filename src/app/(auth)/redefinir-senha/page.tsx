import Link from "next/link";
import { RedefinirSenhaForm } from "@/components/forms/RedefinirSenhaForm";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function RedefinirSenhaPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <div>
      <div className="mb-9">
        <div className="mb-3.5 text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--red)" }}>
          Redefinir senha
        </div>
        <h2 className="mb-2 font-display leading-none" style={{ fontSize: "42px" }}>
          Nova senha
        </h2>
        <p className="text-[14px] text-muted">Escolha uma nova senha para sua conta.</p>
      </div>

      {token ? (
        <RedefinirSenhaForm token={token} />
      ) : (
        <div>
          <div
            className="mb-6 px-4 py-3 text-[13px]"
            style={{ color: "var(--red)", border: "1px solid var(--red)", background: "rgba(167,62,47,0.06)" }}
          >
            Link inválido ou incompleto. Solicite uma nova redefinição de senha.
          </div>
          <Link
            href="/recuperar-senha"
            className="border-b border-current pb-0.5 text-[13px] transition-colors hover:text-accent"
            style={{ color: "var(--red)" }}
          >
            Recuperar senha
          </Link>
        </div>
      )}
    </div>
  );
}
