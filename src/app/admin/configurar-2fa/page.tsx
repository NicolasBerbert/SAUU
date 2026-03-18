import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { TotpSetupPanel } from "@/components/admin/TotpSetupPanel";

export const metadata = { title: "Configurar 2FA | Admin SAUU" };

export default async function Configurar2faPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.type !== "ADMIN") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true },
  });

  return (
    <div className="max-w-md">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-muted mb-1">Segurança</p>
        <h1 className="text-2xl font-light text-primary">Autenticação em dois fatores</h1>
      </div>

      <TotpSetupPanel enabled={!!user?.totpSecret} />
    </div>
  );
}
