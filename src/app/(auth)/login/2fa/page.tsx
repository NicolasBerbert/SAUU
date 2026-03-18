import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TotpForm } from "@/components/forms/TotpForm";

export const metadata = { title: "Verificação 2FA | SAUU" };

export default async function Login2faPage() {
  const session = await getServerSession(authOptions);

  // Sem sessão pendente → vai para login
  if (!session) redirect("/login");
  // Já completou 2FA → vai para admin
  if ((session.user?.type as string) === "ADMIN") redirect("/admin");
  if ((session.user?.type as string) !== "TOTP_PENDING") redirect("/login");

  const pendingToken = (session as any).pendingToken as string;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted mb-1">Verificação em dois fatores</p>
        <h1 className="text-2xl font-light text-primary">Código de autenticação</h1>
      </div>
      <p className="text-sm text-muted">
        Abra o aplicativo autenticador e insira o código de 6 dígitos.
      </p>
      <TotpForm pendingToken={pendingToken} />
    </div>
  );
}
