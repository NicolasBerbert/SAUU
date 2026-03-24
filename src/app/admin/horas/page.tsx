import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HorasPage() {
  const usuarios = await prisma.user.findMany({
    where: { type: { not: "ADMIN" }, active: true },
    include: {
      presentationSlots: {
        where: { attendedAt: { not: null } },
        include: {
          presentation: { select: { title: true, day: true, slot: true, duration: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const tipoLabel: Record<string, string> = {
    UNIFIL: "Unifil",
    EXTERNO: "Ext.",
    FORMADO: "Formado",
  };

  function formatHoras(minutos: number) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-2">Horas por Usuário</h1>
      <p className="text-sm text-muted mb-10">
        Total de horas registradas por presença confirmada nas palestras. Usado para geração de certificados.
      </p>

      <div className="border border-border">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-px bg-border text-[10px] uppercase tracking-widest text-muted px-6 py-3 bg-surface border-b border-border">
          <span>Participante</span>
          <span className="text-center px-4">Tipo</span>
          <span className="text-center px-4">Palestras</span>
          <span className="text-right pl-4">Total</span>
        </div>
        <div className="flex flex-col gap-px bg-border">
          {usuarios.map((u) => {
            const totalMinutos = u.presentationSlots.reduce(
              (sum, s) => sum + s.presentation.duration,
              0
            );
            return (
              <div key={u.id} className="bg-surface grid grid-cols-[1fr_auto_auto_auto] items-center px-6 py-4">
                <div className="min-w-0">
                  <p className="text-sm text-primary truncate">{u.name}</p>
                  <p className="text-xs text-muted truncate">{u.email}</p>
                </div>
                <span className="text-xs text-muted border border-border px-2 py-0.5 mx-4 shrink-0">
                  {tipoLabel[u.type] ?? u.type}
                </span>
                <span className="text-sm text-muted text-center px-4 shrink-0">
                  {u.presentationSlots.length}
                </span>
                <span className={`text-sm font-medium text-right pl-4 shrink-0 ${totalMinutos > 0 ? "text-accent" : "text-muted"}`}>
                  {totalMinutos > 0 ? formatHoras(totalMinutos) : "—"}
                </span>
              </div>
            );
          })}
          {usuarios.length === 0 && (
            <div className="bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted">Nenhum usuário cadastrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
