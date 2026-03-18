import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckinPanel } from "@/components/admin/CheckinPanel";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") redirect("/login");

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Check-in</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-1">Check-in no Evento</h1>
      <p className="text-sm text-muted mb-10">
        Busque o participante pelo nome ou e-mail e confirme a presença.
      </p>
      <CheckinPanel />
    </div>
  );
}
