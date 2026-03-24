import { prisma } from "@/lib/db";
import { PresencaPanel } from "@/components/admin/PresencaPanel";

export const dynamic = "force-dynamic";

export default async function PresencaPage() {
  const palestras = await prisma.presentation.findMany({
    where: { active: true },
    include: {
      slots: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { user: { name: "asc" } },
      },
    },
    orderBy: [{ day: "asc" }, { slot: "asc" }],
  });

  const data = palestras.map((p) => ({
    id: p.id,
    title: p.title,
    speaker: p.speaker,
    day: p.day,
    slot: p.slot,
    inscritos: p.slots.map((s) => ({
      slotId: s.id,
      userId: s.userId,
      name: s.user.name,
      email: s.user.email,
      attendedAt: s.attendedAt?.toISOString() ?? null,
    })),
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-2">Lista de Presença</h1>
      <p className="text-sm text-muted mb-10">
        Marque a presença dos inscritos em cada palestra. Apenas palestras com presença registrada contam para o certificado.
      </p>
      <PresencaPanel palestras={data} />
    </div>
  );
}
