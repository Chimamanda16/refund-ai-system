import { query, withTransaction } from '../db/pool.js';
import { insertAuditEvents } from './auditRepository.js';
import { AppError } from '../utils/errors.js';

export async function findCustomerViewById(id, customerId) {
  const rows = await query(
    `SELECT r.id, r.customer_id, r.order_id, o.order_number, o.order_date, o.status AS order_status,
            o.currency, r.requested_amount, r.reason, r.customer_message, r.status,
            r.policy_result, r.policy_reason, r.resolution_reason, r.created_at, r.updated_at
       FROM refund_requests r JOIN orders o ON o.id = r.order_id
      WHERE r.id = $1 AND r.customer_id = $2`, [id, customerId]);
  return rows[0] ?? null;
}

export function findCustomerHistory(customerId) {
  return query(`SELECT r.id, r.order_id, o.order_number, r.requested_amount, r.status, r.created_at
      FROM refund_requests r JOIN orders o ON o.id = r.order_id
      WHERE r.customer_id = $1 ORDER BY r.created_at DESC`, [customerId]);
}

export function findItems(refundId) {
  return query(`SELECT ri.id, ri.order_item_id, oi.product_name, oi.sku,
      ri.requested_quantity, ri.requested_amount FROM refund_request_items ri
      JOIN order_items oi ON oi.id = ri.order_item_id
      WHERE ri.refund_request_id = $1 ORDER BY ri.id`, [refundId]);
}

export function findMessages(refundId) {
  return query(`SELECT id, sender_type, message, created_at FROM refund_messages
      WHERE refund_request_id = $1 AND sender_type IN ('customer', 'admin') ORDER BY created_at, id`, [refundId]);
}

export async function findOrderContext(orderId, customerId) {
  const rows = await query(`SELECT o.id, o.customer_id, o.order_date, o.order_number
    FROM orders o WHERE o.id = $1 AND o.customer_id = $2`, [orderId, customerId]);
  return rows[0] ?? null;
}

export function findOrderItems(orderId) {
  return query(`SELECT id, order_id, product_name, sku, quantity, unit_price, is_final_sale
    FROM order_items WHERE order_id = $1 ORDER BY id`, [orderId]);
}

export async function findRefundHistory(customerId) {
  return query(`SELECT status, ai_category, ai_suspicious, created_at FROM refund_requests
    WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10`, [customerId]);
}

export async function hasExistingRefundRequest(orderItemId) {
  const rows = await query(`SELECT EXISTS (
    SELECT 1 FROM refund_request_items ri WHERE ri.order_item_id = $1
  ) AS requested`, [orderItemId]);
  return rows[0]?.requested ? 1 : 0;
}

export function createWithAudit(data) {
  return withTransaction(async (client) => {
    for (const requested of [...data.items].sort((left, right) => left.id - right.id)) {
      const locked = await client.query('SELECT id, order_id, quantity FROM order_items WHERE id = $1 FOR UPDATE', [requested.id]);
      const item = locked.rows[0];
      if (!item || item.order_id !== data.orderId) throw new AppError(400, 'ITEM_NOT_IN_ORDER', 'A selected item does not belong to this order.');
      const existingRequest = await client.query(`SELECT EXISTS (
        SELECT 1 FROM refund_request_items ri WHERE ri.order_item_id = $1
      ) AS requested`, [item.id]);
      if (existingRequest.rows[0].requested) {
        throw new AppError(409, 'ITEM_ALREADY_REQUESTED', 'A refund has already been requested for one or more selected items.');
      }
    }
    const inserted = await client.query(`INSERT INTO refund_requests
      (customer_id, order_id, requested_amount, reason, customer_message, status,
       ai_category, ai_confidence, ai_summary, ai_suspicious, policy_result, policy_reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [data.customerId, data.orderId, data.amount, data.reason, data.message, data.decision,
      data.ai?.category ?? null, data.ai?.confidence ?? null, data.ai?.summary ?? null,
      data.ai?.suspicious ?? null, data.policyCode, data.policyReason]);
    const id = inserted.rows[0].id;
    for (const item of data.items) await client.query(`INSERT INTO refund_request_items
      (refund_request_id, order_item_id, requested_quantity, requested_amount) VALUES ($1,$2,$3,$4)`,
    [id, item.id, item.requestedQuantity, item.lineAmount]);
    if (data.message) await client.query(`INSERT INTO refund_messages (refund_request_id,sender_type,message)
      VALUES ($1,'customer',$2)`, [id, data.message]);
    const events = [
      ['refund_request_created', { customerId: data.customerId, orderId: data.orderId }],
      ['refund_ai_classified', data.ai ?? { valid: false }],
      ['refund_policy_evaluated', { code: data.policyCode, decision: data.decision }],
    ];
    await insertAuditEvents(client, id, events.map(([action, metadata]) => ({ action, metadata, status: data.decision, reason: data.policyReason })));
    return id;
  });
}

export async function addCustomerMessage(refundId, customerId, message) {
  return addMessage(refundId, 'customer', message, customerId);
}

export async function addAdminMessage(refundId, message) {
  return addMessage(refundId, 'admin', message);
}

async function addMessage(refundId, senderType, message, customerId = null) {
  return withTransaction(async (client) => {
    const rows = await client.query(`SELECT id, status FROM refund_requests WHERE id = $1 AND ($2::int IS NULL OR customer_id = $2) FOR UPDATE`, [refundId, customerId]);
    const refund = rows.rows[0];
    if (!refund) return null;
    if (!['pending', 'escalated'].includes(refund.status)) throw new AppError(409, 'REQUEST_CLOSED', 'Messages are available while the request is open.');
    await client.query(`INSERT INTO refund_messages (refund_request_id, sender_type, message) VALUES ($1, $2, $3)`, [refundId, senderType, message]);
    await client.query(`INSERT INTO audit_logs (refund_request_id, actor_type, actor_id, action, new_status, metadata)
      VALUES ($1, $2, $3, $4, $5, '{}'::jsonb)`, [refundId, senderType, customerId ? String(customerId) : null, `${senderType}_message_sent`, refund.status]);
    return refund.id;
  });
}
