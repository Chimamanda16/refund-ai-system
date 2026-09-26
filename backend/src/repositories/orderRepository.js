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
    `SELECT id, order_id, product_name, sku, quantity, unit_price, is_final_sale,
            (quantity * unit_price) AS line_total
       FROM order_items
      WHERE order_id = ANY($1::int[])
      ORDER BY order_id, id`,
    [orderIds],
  );
}
