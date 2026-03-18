import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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

  const isPaid = user?.eventRegistration?.paymentStatus === "APPROVED";

  if (!isPaid) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">Programação</span>
        </div>
        <h1 className="text-3xl font-light text-primary mb-2">Selecionar Palestras</h1>
        <p className="text-sm text-muted mb-10">
          Para selecionar palestras, você precisa primeiro confirmar sua inscrição no evento.
        </p>
        <div className="border border-border p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-primary mb-1">Inscrição não confirmada</p>
            <p className="text-xs text-muted">
              Realize o pagamento para liberar a seleção de palestras.
            </p>
          </div>
          <Link href="/checkout">
            <Button variant="primary" className="text-xs tracking-widest uppercase whitespace-nowrap">
              Confirmar inscrição
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const userSlotIds = new Set(user!.presentationSlots.map((s) => s.presentationId));

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
            Selecione quantas palestras quiser. Há duas por dia — 19h00 e 20h45 — e você pode se inscrever em todas. Altere sua seleção a qualquer momento.
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
