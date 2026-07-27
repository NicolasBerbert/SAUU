import { prisma } from "@/lib/db";
import { PresentationManager } from "@/components/admin/PresentationManager";

export const dynamic = "force-dynamic";

export default async function AdminPalestrasPage() {
  const [presentations, palestrantes] = await Promise.all([
    prisma.presentation.findMany({
      orderBy: [{ day: "asc" }, { slot: "asc" }],
      include: {
        _count: { select: { slots: true } },
        speakers: { orderBy: { order: "asc" }, select: { palestranteId: true } },
      },
    }),
    prisma.palestrante.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, role: true },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-2">Palestras</h1>
      <p className="text-sm text-muted mb-10">Gerencie a grade de palestras do evento.</p>

      <PresentationManager initial={presentations} palestrantes={palestrantes} />
    </div>
  );
}
