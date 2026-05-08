import { prisma } from "@/lib/db";
import { PatrocinadorManager } from "@/components/admin/PatrocinadorManager";

export const dynamic = "force-dynamic";

export default async function AdminPatrocinadoresPage() {
  const sponsors = await prisma.patrocinador.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-2">Patrocinadores</h1>
      <p className="text-sm text-muted mb-10">
        Gerencie os patrocinadores do evento. Use o nível (Ouro, Prata, Bronze) para agrupá-los na página pública.
      </p>

      <PatrocinadorManager initial={sponsors} />
    </div>
  );
}
