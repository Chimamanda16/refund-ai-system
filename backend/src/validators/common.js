import { z } from 'zod';

// Postgres SERIAL max; keeps absurd ids from reaching the database.
export const idSchema = z.coerce.number().int().positive().max(2_147_483_647);

export const customerIdParams = z.object({ customerId: idSchema });
export const orderIdParams = z.object({ orderId: idSchema });
export const refundIdParams = z.object({ refundId: idSchema });
export const customerIdQuery = z.object({ customerId: idSchema });
