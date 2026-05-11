"use client";

import { useEffect, useState } from "react";

interface AuditEntry {
  id: string;
  actorType: string;
  action: string;
  entityId: string | null;
  entityType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
}

const ACTION_COLOR: Record<string, string> = {
  REGISTRATION_PAYMENT_APPROVED: "text-success",
  CHECKOUT_COMBINED_APPROVED: "text-success",
  ORDER_APPROVED: "text-success",
  REGISTRATION_MANUALLY_APPROVED: "text-success",
  CHARGE_DISPUTE_CREATED: "text-danger",
  REGISTRATION_REFUNDED: "text-accent",
  ORDER_REFUNDED: "text-accent",
  REGISTRATION_REFUND_ISSUED: "text-accent",
  USER_TYPE_CHANGED: "text-accent",
  USER_DEACTIVATED: "text-danger",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    const res = await fetch(`/api/admin/audit?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, action, entityType]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-light text-primary mb-1">Audit Log</h1>
          <p className="text-sm text-muted">{total} registros</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <input
          className="border border-border bg-surface text-primary px-3 py-1.5 text-xs w-56"
          placeholder="Filtrar por ação..."
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
        />
        <select
          className="border border-border bg-surface text-primary px-3 py-1.5 text-xs"
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
        >
          <option value="">Todos os tipos</option>
          <option value="EventRegistration">Inscrição</option>
          <option value="Order">Pedido</option>
          <option value="User">Usuário</option>
          <option value="Charge">Charge</option>
        </select>
      </div>

      <div className="border border-border">
        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 border-b border-border bg-surface">
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Data</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Ator</p>
          <p className="col-span-3 text-[10px] uppercase tracking-widest text-muted">Ação</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Entidade</p>
          <p className="col-span-3 text-[10px] uppercase tracking-widest text-muted">Detalhes</p>
        </div>

        <div className="flex flex-col gap-px bg-border">
          {loading && (
            <div className="bg-surface px-5 py-8 text-center text-sm text-muted">Carregando...</div>
          )}
          {!loading && logs.length === 0 && (
            <div className="bg-surface px-5 py-8 text-center text-sm text-muted">Nenhum registro.</div>
          )}
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-surface px-5 py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-start text-xs"
            >
              <p className="sm:col-span-2 text-muted tabular-nums">
                {new Date(log.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </p>
              <div className="sm:col-span-2 min-w-0">
                <p className="text-primary truncate">{log.actor?.name ?? "—"}</p>
                <p className="text-muted truncate">{log.actorType}</p>
              </div>
              <p className={`sm:col-span-3 font-medium truncate ${ACTION_COLOR[log.action] ?? "text-primary"}`}>
                {log.action}
              </p>
              <div className="sm:col-span-2 min-w-0">
                <p className="text-muted truncate">{log.entityType ?? "—"}</p>
                <p className="text-muted truncate font-mono text-[10px]">{log.entityId?.slice(0, 12) ?? ""}</p>
              </div>
              <p className="sm:col-span-3 text-muted font-mono text-[10px] break-all">
                {log.metadata ? JSON.stringify(log.metadata) : ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-5 justify-end">
          <button
            className="text-xs text-muted hover:text-primary disabled:opacity-30"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span className="text-xs text-muted">{page} / {totalPages}</span>
          <button
            className="text-xs text-muted hover:text-primary disabled:opacity-30"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
