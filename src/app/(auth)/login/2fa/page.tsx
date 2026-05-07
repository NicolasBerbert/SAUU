import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TotpForm } from "@/components/forms/TotpForm";

export const metadata = { title: "Verificação 2FA | CLBB" };

export default async function Login2faPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if ((session.user?.type as string) === "ADMIN") redirect("/admin");
  if ((session.user?.type as string) !== "TOTP_PENDING") redirect("/login");

  const pendingToken = (session as any).pendingToken as string;

  return (
    <div>
      <div className="mb-9">
        <div
          className="mb-3.5 text-[11px] uppercase tracking-[0.24em]"
          style={{ color: "var(--red)" }}
        >
          Verificação em dois fatores
        </div>
        <h2
          className="mb-2 font-display leading-none"
          style={{ fontSize: "36px" }}
        >
          Código de
          <br />
          autenticação
        </h2>
        <p className="text-[14px] text-muted">
          Abra o aplicativo autenticador e insira o código de 6 dígitos.
        </p>
      </div>
      <TotpForm pendingToken={pendingToken} />
    </div>
  );
}
