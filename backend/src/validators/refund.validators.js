import { z } from 'zod';
import { idSchema } from './common.js';

export const REFUND_REASONS = [
  'damaged',
  'incorrect_item',
  'not_delivered',
  'not_as_described',
  'changed_mind',
  'other',
];

export const REFUND_STATUSES = ['pending', 'approved', 'denied', 'escalated'];

// Shape check
export const createRefundBody = z.object({
  customerId: idSchema,
  orderId: idSchema,
  reason: z.enum(REFUND_REASONS),
  customerMessage: z.string().trim().max(2000).optional(),
  requestedAmount: z.number().positive().max(1_000_000),
  items: z
    .array(
      z.object({
        orderItemId: idSchema,
        quantity: z.number().int().positive().max(1000),
      }),
    )
    .min(1)
    .max(50),
});

export const adminRefundListQuery = z.object({
  status: z.enum(REFUND_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});
