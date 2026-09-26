import { query } from '../db/pool.js';

const ORDER_COLUMNS = `o.id, o.customer_id, o.order_number, o.order_date, o.status,
                       o.total_amount, o.currency, o.created_at`;

export function findByCustomerId(customerId) {
  return query(
    `SELECT ${ORDER_COLUMNS}
       FROM orders o
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC`,
    [customerId],
  );
}

export async function findById(id) {
  const rows = await query(
    `SELECT ${ORDER_COLUMNS}, c.name AS customer_name, c.email AS customer_email
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
      WHERE o.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findItemsByOrderIds(orderIds) {
  if (orderIds.length === 0) return [];
  return query(
    `SELECT oi.id, oi.order_id, oi.product_name, oi.sku, oi.quantity, oi.unit_price, oi.is_final_sale,
            (oi.quantity * oi.unit_price) AS line_total,
            CASE WHEN EXISTS (SELECT 1 FROM refund_request_items ri WHERE ri.order_item_id = oi.id)
              THEN 0 ELSE oi.quantity END AS remaining_quantity
       FROM order_items oi
      WHERE order_id = ANY($1::int[])
      ORDER BY oi.order_id, oi.id`,
    [orderIds],
  );
}

export async function findItemsByOrderId(orderId) {
  return query(
    `SELECT oi.id, oi.order_id, oi.product_name, oi.sku, oi.quantity, oi.unit_price, oi.is_final_sale,
            (oi.quantity * oi.unit_price) AS line_total,
            CASE WHEN EXISTS (SELECT 1 FROM refund_request_items ri WHERE ri.order_item_id = oi.id)
              THEN 0 ELSE oi.quantity END AS remaining_quantity
       FROM order_items oi
      WHERE oi.order_id = $1
      ORDER BY oi.order_id, oi.id`,
    [orderId],
  );
}
