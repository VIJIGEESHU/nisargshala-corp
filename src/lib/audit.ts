import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';

export async function logAuditEvent(params: {
  actorId?: string;
  actorType?: 'SYSTEM' | 'ADMIN' | 'RETAIL_API' | 'CORPORATE_USER';
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    if (!isSupabaseConfigured()) {
      console.log(`[AUDIT_LOG_DEV] ${params.action} on ${params.entityType}:${params.entityId || 'N/A'}`);
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: params.actorId || null,
      actor_type: params.actorType || 'SYSTEM',
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
      ip_address: params.ipAddress || null,
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
