import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  UNIFIL: "Unifil",
  UEL: "UEL",
  FORMADO: "Formado",
  ADMIN: "Admin",
};

const statusLabel: Record<string, string> = {
  APPROVED: "Pago",
  PENDING: "Pendente",
  REJECTED: "Recusado",
};

const statusColor: Record<string, string> = {
  APPROVED: "text-success",
  PENDING: "text-accent",
  REJECTED: "text-danger",
};

export default async function AdminUsuariosPage() {
  const users = await prisma.user.findMany({
    where: { type: { not: "ADMIN" } },
    include: {
      eventRegistration: true,
      _count: { select: { presentationSlots: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPaid = users.filter((u) => u.eventRegistration?.paymentStatus === "APPROVED").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-light text-primary mb-2">Usuários</h1>
          <p className="text-sm text-muted">
            {users.length} cadastrados · {totalPaid} com inscrição paga
          </p>
        </div>
        <a
          href="/api/admin/exportar"
          className="text-xs uppercase tracking-widest border border-accent px-4 py-2 text-accent hover:bg-accent hover:text-background transition-colors"
        >
          Exportar CSV
        </a>
      </div>

      <div className="border border-border">
        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-surface">
          <p className="col-span-3 text-[10px] uppercase tracking-widest text-muted">Nome</p>
          <p className="col-span-3 text-[10px] uppercase tracking-widest text-muted">E-mail</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Tipo</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Inscrição</p>
          <p className="col-span-1 text-[10px] uppercase tracking-widest text-muted">Palestras</p>
          <p className="col-span-1 text-[10px] uppercase tracking-widest text-muted text-right">Cadastro</p>
        </div>

        <div className="flex flex-col gap-px bg-border">
          {users.length === 0 && (
            <div className="bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted">Nenhum usuário cadastrado.</p>
            </div>
          )}
          {users.map((u) => {
            const status = u.eventRegistration?.paymentStatus ?? null;
            return (
              <div key={u.id} className="bg-surface px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center">
                <p className="sm:col-span-3 text-sm text-primary truncate">{u.name}</p>
                <p className="sm:col-span-3 text-xs text-muted truncate">{u.email}</p>
                <p className="sm:col-span-2 text-xs text-muted">{typeLabel[u.type] ?? u.type}</p>
                <p className={`sm:col-span-2 text-xs ${status ? statusColor[status] : "text-muted"}`}>
                  {status ? statusLabel[status] ?? status : "—"}
                </p>
                <p className="sm:col-span-1 text-xs text-muted">{u._count.presentationSlots}</p>
                <p className="sm:col-span-1 text-xs text-muted sm:text-right">
                  {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
