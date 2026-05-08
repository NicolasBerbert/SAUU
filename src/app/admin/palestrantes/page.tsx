import { prisma } from "@/lib/db";
import { PalestranteManager } from "@/components/admin/PalestranteManager";

export const dynamic = "force-dynamic";

export default async function AdminPalestrantesPage() {
  const palestrantes = await prisma.palestrante.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-2">Palestrantes</h1>
      <p className="text-sm text-muted mb-10">
        Adicione, edite ou remova palestrantes. A ordem de exibição determina a sequência na página pública.
      </p>

      <PalestranteManager initial={palestrantes} />
    </div>
  );
}
