import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserTypeButton } from "@/components/admin/UserTypeButton";
import { UserActionButtons } from "@/components/admin/UserActionButtons";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  UNIFIL: "Unifil",
  EXTERNO: "Ext.",
  FORMADO: "Formado",
  ADMIN: "Admin",
};

const typeColor: Record<string, string> = {
  ADMIN: "text-accent font-medium",
  UNIFIL: "text-muted",
  EXTERNO: "text-muted",
  FORMADO: "text-muted",
};

const statusLabel: Record<string, string> = {
  APPROVED: "Pago",
  PENDING: "Pendente",
  REJECTED: "Recusado",
  REFUNDED: "Reembolsado",
};

const statusColor: Record<string, string> = {
  APPROVED: "text-success",
  PENDING: "text-accent",
  REJECTED: "text-danger",
  REFUNDED: "text-muted",
};

export default async function AdminUsuariosPage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? "";

  const users = await prisma.user.findMany({
    include: {
      eventRegistration: true,
      _count: { select: { presentationSlots: true } },
    },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
  });

  const nonAdmins = users.filter((u) => u.type !== "ADMIN");
  const totalPaid = nonAdmins.filter(
    (u) => u.eventRegistration?.paymentStatus === "APPROVED"
  ).length;
  const totalAdmins = users.filter((u) => u.type === "ADMIN").length;

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
            {nonAdmins.length} inscritos · {totalPaid} com pagamento aprovado · {totalAdmins} admin
            {totalAdmins !== 1 ? "s" : ""}
          </p>
        </div>
        <a
          href="/api/admin/exportar"
          className="text-xs uppercase tracking-widest border border-accent px-4 py-2 text-accent hover:bg-accent hover:text-background transition-colors"
        >
          Exportar Excel
        </a>
      </div>

      <div className="border border-border">
        {/* Header */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-surface">
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Nome</p>
          <p className="col-span-3 text-[10px] uppercase tracking-widest text-muted">E-mail</p>
          <p className="col-span-1 text-[10px] uppercase tracking-widest text-muted">Tipo</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Inscrição</p>
          <p className="col-span-1 text-[10px] uppercase tracking-widest text-muted">Palestras</p>
          <p className="col-span-3 text-[10px] uppercase tracking-widest text-muted text-right">Ações</p>
        </div>

        <div className="flex flex-col gap-px bg-border">
          {users.length === 0 && (
            <div className="bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted">Nenhum usuário cadastrado.</p>
            </div>
          )}
          {users.map((u) => {
            const status = u.eventRegistration?.paymentStatus ?? null;
            const isSelf = u.id === currentUserId;
            return (
              <div
                key={u.id}
                className="bg-surface px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 lg:items-center"
              >
                <div className="lg:col-span-2 min-w-0">
                  <p className="text-sm text-primary truncate">{u.name}</p>
                  {isSelf && (
                    <span className="text-[10px] uppercase tracking-widest text-muted">você</span>
                  )}
                  {!u.emailVerified && u.type !== "ADMIN" && (
                    <span className="text-[10px] uppercase tracking-widest text-danger">e-mail não verificado</span>
                  )}
                </div>
                <p className="lg:col-span-3 text-xs text-muted truncate">{u.email}</p>
                <p className={`lg:col-span-1 text-xs ${typeColor[u.type] ?? "text-muted"}`}>
                  {typeLabel[u.type] ?? u.type}
                </p>
                <p className={`lg:col-span-2 text-xs ${status ? statusColor[status] : "text-muted"}`}>
                  {u.type === "ADMIN" ? "—" : (status ? statusLabel[status] ?? status : "—")}
                </p>
                <p className="lg:col-span-1 text-xs text-muted">
                  {u.type === "ADMIN" ? "—" : u._count.presentationSlots}
                </p>
                <div className="lg:col-span-3 flex flex-wrap gap-2 justify-end">
                  <UserTypeButton
                    userId={u.id}
                    currentType={u.type}
                    userName={u.name}
                    isSelf={isSelf}
                  />
                  {u.type !== "ADMIN" && !isSelf && (
                    <UserActionButtons
                      userId={u.id}
                      userName={u.name}
                      emailVerified={u.emailVerified}
                      paymentStatus={status}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
