import { prisma } from "@/lib/db";

export interface AuditLogRecord {
  id: string;
  user_id: string;
  user_role: "ADMIN" | "TEACHER" | "AUDIT" | string;
  shift_id: string | null;
  device_terminal: string | null;
  action_type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  entity_name: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  description: string;
  created_at: string;
}

// In-memory fallback global singleton for immutable audit logs
const globalAuditStore = globalThis as unknown as {
  __tefa_audit_logs?: AuditLogRecord[];
};

if (!globalAuditStore.__tefa_audit_logs) {
  globalAuditStore.__tefa_audit_logs = [];
}

export async function recordAuditLog(data: {
  user_id?: string;
  user_role?: string;
  shift_id?: string | null;
  device_terminal?: string | null;
  action_type: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  entity_name: string;
  entity_id: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  description: string;
}): Promise<AuditLogRecord> {
  const severity = data.severity || "INFO";
  const userId = data.user_id || "00000000-0000-0000-0000-000000000001";
  const userRole = data.user_role || "ADMIN";

  try {
    const created = await prisma.auditLog.create({
      data: {
        user_id: userId,
        user_role: userRole,
        shift_id: data.shift_id || null,
        device_terminal: data.device_terminal || null,
        action_type: data.action_type,
        severity: severity as any,
        entity_name: data.entity_name,
        entity_id: data.entity_id,
        old_values: data.old_values ? (data.old_values as any) : undefined,
        new_values: data.new_values ? (data.new_values as any) : undefined,
        description: data.description,
      },
    });

    const record: AuditLogRecord = {
      id: created.id,
      user_id: created.user_id,
      user_role: created.user_role,
      shift_id: created.shift_id,
      device_terminal: created.device_terminal,
      action_type: created.action_type,
      severity: created.severity as "INFO" | "WARNING" | "CRITICAL",
      entity_name: created.entity_name,
      entity_id: created.entity_id,
      old_values: created.old_values as Record<string, unknown> | null,
      new_values: created.new_values as Record<string, unknown> | null,
      description: created.description,
      created_at: created.created_at.toISOString(),
    };

    // Keep memory cache updated
    globalAuditStore.__tefa_audit_logs?.unshift(record);
    return record;
  } catch (err) {
    console.warn("Database connection unavailable for audit log, using memory store:", err);
  }

  // Memory store fallback
  const memoryRecord: AuditLogRecord = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    user_role: userRole,
    shift_id: data.shift_id || null,
    device_terminal: data.device_terminal || null,
    action_type: data.action_type,
    severity,
    entity_name: data.entity_name,
    entity_id: data.entity_id,
    old_values: data.old_values || null,
    new_values: data.new_values || null,
    description: data.description,
    created_at: new Date().toISOString(),
  };

  globalAuditStore.__tefa_audit_logs?.unshift(memoryRecord);
  return memoryRecord;
}

export async function getAuditLogs(filter?: {
  severity?: string;
  action_type?: string;
  limit?: number;
}): Promise<AuditLogRecord[]> {
  const limit = filter?.limit || 50;

  try {
    const where: Record<string, unknown> = {};
    if (filter?.severity) where.severity = filter.severity;
    if (filter?.action_type) where.action_type = filter.action_type;

    const list = await prisma.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
    });

    if (list.length > 0) {
      return list.map((l) => ({
        id: l.id,
        user_id: l.user_id,
        user_role: l.user_role,
        shift_id: l.shift_id,
        device_terminal: l.device_terminal,
        action_type: l.action_type,
        severity: l.severity as "INFO" | "WARNING" | "CRITICAL",
        entity_name: l.entity_name,
        entity_id: l.entity_id,
        old_values: l.old_values as Record<string, unknown> | null,
        new_values: l.new_values as Record<string, unknown> | null,
        description: l.description,
        created_at: l.created_at.toISOString(),
      }));
    }
  } catch {
    // Memory store fallback
  }

  let memoryLogs = globalAuditStore.__tefa_audit_logs || [];
  if (filter?.severity) {
    memoryLogs = memoryLogs.filter((l) => l.severity === filter.severity);
  }
  if (filter?.action_type) {
    memoryLogs = memoryLogs.filter((l) => l.action_type === filter.action_type);
  }
  return memoryLogs.slice(0, limit);
}
