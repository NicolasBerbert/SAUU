import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slotMinutes } from "@/lib/utils";

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
  const isLocked = !!user?.eventRegistration?.presentationsConfirmedAt;

  const presentations = await prisma.presentation.findMany({
    where: { active: true },
    include: { _count: { select: { slots: true } } },
  });

  const data = presentations
    // slot é texto livre ("19:00", "9h30"): ordena por dia e depois pelo horário real.
    .sort((a, b) => a.day - b.day || slotMinutes(a.slot) - slotMinutes(b.slot))
    .map((p) => ({
      id: p.id,
      title: p.title,
      speaker: p.speaker,
      bio: p.bio,
      day: p.day,
      slot: p.slot,
      duration: p.duration,
      maxCapacity: p.maxCapacity,
      spotsLeft: p.maxCapacity - p._count.slots,
      isUserRegistered: userSlotIds.has(p.id),
    }));

  return (
    <div>
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3.5">
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
          <span className="eyebrow">Programação</span>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1
              className="mb-2 font-display leading-none text-primary"
              style={{ fontSize: "40px" }}
            >
              Selecionar{" "}
              <em style={{ color: "var(--red)" }}>Palestras</em>
            </h1>
            <p className="text-[14px] text-muted">
              {isLocked
                ? "Suas palestras estão confirmadas. A seleção não pode mais ser alterada."
                : "Selecione as palestras que deseja assistir. Ao confirmar, sua seleção será travada e não poderá mais ser alterada."}
            </p>
          </div>
          <Link
            href="/minhas-palestras"
            className="whitespace-nowrap border-b border-current pb-0.5 text-[12px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
          >
            Ver minhas inscrições
          </Link>
        </div>
      </div>

      <SelecaoPalestras presentations={data} locked={isLocked} />
    </div>
  );
}
