import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

/**
 * Records an admin action to the AuditLog table.
 * Safe to call - catches errors internally to never break the parent transaction.
 */
export async function recordAuditLog(params: {
  action: string;
  actorType: 'ADMIN' | 'SYSTEM';
  actorId?: string | null;
  entityType: string;
  entityId: string;
  before?: Prisma.JsonValue;
  after?: Prisma.JsonValue;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        actorType: params.actorType,
        actorId: params.actorId ?? null,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before ?? undefined,
        after: params.after ?? undefined,
      },
    });
    console.log(`[ADMIN] Audit log recorded: ${params.action} on ${params.entityType}:${params.entityId}`);
  } catch (error) {
    console.error('[ADMIN] Failed to record audit log:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
  }
}

/**
 * Fetches audit logs with optional filtering.
 */
export async function getAuditLogs(params: {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.AuditLogWhereInput = {};
  
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.actorId) where.actorId = params.actorId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
