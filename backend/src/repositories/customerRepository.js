import { query } from '../db/pool.js';

export function findAll() {
  return query(
    `SELECT c.id, c.name, c.email, c.phone, c.created_at,
            COUNT(o.id)::int AS order_count
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.name`,
  );
}

export async function findById(id) {
  const rows = await query(
    'SELECT id, name, email, phone, created_at FROM customers WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}
