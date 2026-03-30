import db from '@/lib/db';

export async function logAudit(
  userId: number | string | null,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT',
  tableName?: string,
  recordId?: number | string | null,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null,
  ipAddress?: string
) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId ? Number(userId) : null,
        action,
        tableName || null,
        recordId ? Number(recordId) : null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
