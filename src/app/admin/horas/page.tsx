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
      <div className="flex items-end justify-between mb-2">
        <h1 className="text-3xl font-light text-primary">Horas por Usuário</h1>
        <a
          href="/api/admin/exportar/horas"
          className="text-xs uppercase tracking-widest border border-border text-muted hover:border-accent hover:text-accent transition-colors px-4 py-2"
        >
          Exportar CSV
        </a>
      </div>
      <p className="text-sm text-muted mb-10">
        Total de horas registradas por presença confirmada nas palestras. Usado para geração de certificados.
      </p>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left text-[10px] uppercase tracking-widest text-muted px-6 py-3 font-normal">Participante</th>
              <th className="text-left text-[10px] uppercase tracking-widest text-muted px-6 py-3 font-normal w-24">Tipo</th>
              <th className="text-center text-[10px] uppercase tracking-widest text-muted px-6 py-3 font-normal w-28">Palestras</th>
              <th className="text-right text-[10px] uppercase tracking-widest text-muted px-6 py-3 font-normal w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usuarios.map((u) => {
              const totalMinutos = u.presentationSlots.reduce(
                (sum, s) => sum + s.presentation.duration,
                0
              );
              return (
                <tr key={u.id} className="bg-surface">
                  <td className="px-6 py-4">
                    <p className="text-sm text-primary">{u.name}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted border border-border px-2 py-0.5">
                      {tipoLabel[u.type] ?? u.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-muted">
                    {u.presentationSlots.length}
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-medium ${totalMinutos > 0 ? "text-accent" : "text-muted"}`}>
                    {totalMinutos > 0 ? formatHoras(totalMinutos) : "—"}
                  </td>
                </tr>
              );
            })}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
