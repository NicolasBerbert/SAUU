import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

type ActorType = "USER" | "ADMIN" | "SYSTEM" | "WEBHOOK";

interface AuditParams {
  actorId?: string;
  actorType: ActorType;
  action: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
}

// Registra uma entrada no AuditLog. Nunca lança exceção — falhas são logadas
// mas não interrompem o fluxo principal.
export async function audit(params: AuditParams): Promise<void> {
  try {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      actorType: params.actorType,
      action: params.action,
      actorId: params.actorId ?? null,
      entityId: params.entityId ?? null,
      entityType: params.entityType ?? null,
      metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
    };
    await prisma.auditLog.create({ data });
  } catch (err) {
    logger.error("audit", err);
  }
}
