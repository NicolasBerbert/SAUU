import { prisma } from "@/lib/db";
import { ComissaoManager } from "@/components/admin/ComissaoManager";

export const dynamic = "force-dynamic";

export default async function AdminComissaoPage() {
  const members = await prisma.comissaoMember.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-2">Comissão</h1>
      <p className="text-sm text-muted mb-10">
        Gerencie os membros da Comissão Lina Bo Bardi exibidos no site.
      </p>

      <ComissaoManager initial={members} />
    </div>
  );
}
