import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function recordAuditLog(params: {
  action: string;
  actorType: string;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  before?: Prisma.JsonValue;
  after?: Prisma.JsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
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
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        reason: params.reason ?? null,
      },
    });
    console.log(`[ADMIN] Audit log recorded: ${params.action} on ${params.entityType}:${params.entityId}`);
  } catch (error) {
    console.error('[ADMIN] Failed to record audit log:', error);
  }
}

export async function getAuditLogs(params: {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
  action?: string;
}) {
  const where: Prisma.AuditLogWhereInput = {};
  
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.actorId) where.actorId = params.actorId;
  if (params.action) where.action = { contains: params.action, mode: 'insensitive' };

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
