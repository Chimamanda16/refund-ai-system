import { query } from '../db/pool.js';

// ADMIN-ONLY. Never import this from customer-facing services/controllers.

export function countRefundsByStatus() {
  return query('SELECT status, COUNT(*)::int AS count FROM refund_requests GROUP BY status');
}

export function listRefunds({ status, limit, offset }) {
  return query(
    `SELECT r.id, r.customer_id, c.name AS customer_name, r.order_id, o.order_number,
            r.requested_amount, r.reason, r.status, r.ai_category, r.ai_confidence,
            r.ai_suspicious, r.policy_result, r.created_at, r.updated_at
       FROM refund_requests r
       JOIN customers c ON c.id = r.customer_id
       JOIN orders o ON o.id = r.order_id
      WHERE ($1::text IS NULL OR r.status = $1)
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3`,
    [status ?? null, limit, offset],
  );
}

export async function findRefundById(id) {
  const rows = await query(
    `SELECT r.*, c.name AS customer_name, c.email AS customer_email, o.order_number
       FROM refund_requests r
       JOIN customers c ON c.id = r.customer_id
       JOIN orders o ON o.id = r.order_id
      WHERE r.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export function findNotes(refundId) {
  return query(
    `SELECT id, admin_name, note, created_at
       FROM admin_notes WHERE refund_request_id = $1 ORDER BY created_at, id`,
    [refundId],
  );
}

export function findAuditLogs(refundId) {
  return query(
    `SELECT id, actor_type, actor_id, action, previous_status, new_status,
            reason, metadata, created_at
       FROM audit_logs WHERE refund_request_id = $1 ORDER BY created_at, id`,
    [refundId],
  );
}
