import { query } from '../db/pool.js';

// CUSTOMER-SAFE. Keep internal data (admin_notes, audit_logs, ai_*, policy_*) out of this file.
// Internal reads live in adminRepository.js.

export async function findCustomerViewById(id) {
  const rows = await query(
    `SELECT r.id, r.customer_id, r.order_id, o.order_number, r.requested_amount,
            r.reason, r.customer_message, r.status, r.created_at, r.updated_at
       FROM refund_requests r
       JOIN orders o ON o.id = r.order_id
      WHERE r.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export function findItems(refundId) {
  return query(
    `SELECT ri.id, ri.order_item_id, oi.product_name, oi.sku,
            ri.requested_quantity, ri.requested_amount
       FROM refund_request_items ri
       JOIN order_items oi ON oi.id = ri.order_item_id
      WHERE ri.refund_request_id = $1
      ORDER BY ri.id`,
    [refundId],
  );
}

export function findMessages(refundId) {
  return query(
    `SELECT id, sender_type, message, created_at
       FROM refund_messages
      WHERE refund_request_id = $1
      ORDER BY created_at, id`,
    [refundId],
  );
}
