import { prisma } from "@/lib/db";
import { SpeakerManager } from "@/components/admin/SpeakerManager";

export const dynamic = "force-dynamic";

export default async function AdminPalestrantesPage() {
  const presentations = await prisma.presentation.findMany({
    orderBy: [{ day: "asc" }, { slot: "asc" }],
    select: {
      id: true,
      speaker: true,
      bio: true,
      imageUrl: true,
      title: true,
      day: true,
      slot: true,
      active: true,
    },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-2">Palestrantes</h1>
      <p className="text-sm text-muted mb-10">
        Gerencie fotos e bios dos palestrantes. Os dados são salvos por palestra.
      </p>

      <SpeakerManager initial={presentations} />
    </div>
  );
}
