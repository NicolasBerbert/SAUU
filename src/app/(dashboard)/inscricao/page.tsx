import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SelecaoPalestras } from "@/components/palestras/SelecaoPalestras";

export default async function InscricaoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      eventRegistration: true,
      presentationSlots: { select: { presentationId: true } },
    },
  });

  const userSlotIds = new Set(user?.presentationSlots.map((s) => s.presentationId) ?? []);

  const presentations = await prisma.presentation.findMany({
    where: { active: true },
    include: { _count: { select: { slots: true } } },
    orderBy: [{ day: "asc" }, { slot: "asc" }],
  });

  const data = presentations.map((p) => ({
    id: p.id,
    title: p.title,
    speaker: p.speaker,
    bio: p.bio,
    day: p.day,
    slot: p.slot,
    maxCapacity: p.maxCapacity,
    spotsLeft: p.maxCapacity - p._count.slots,
    isUserRegistered: userSlotIds.has(p.id),
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Programação</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-light text-primary mb-2">Selecionar Palestras</h1>
          <p className="text-sm text-muted">
            Selecione as palestras que deseja assistir. Você pode alterar sua seleção a qualquer momento.
          </p>
        </div>
        <Link
          href="/minhas-palestras"
          className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors whitespace-nowrap"
        >
          Ver minhas inscrições
        </Link>
      </div>

      <SelecaoPalestras presentations={data} />
    </div>
  );
}
