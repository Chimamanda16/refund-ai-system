import { z } from 'zod';
import { idSchema } from './common.js';

export const REFUND_REASONS = ['damaged', 'incorrect_item', 'not_delivered', 'not_as_described', 'changed_mind', 'other'];
export const REFUND_STATUSES = ['pending', 'approved', 'denied', 'escalated'];

export const createRefundBody = z.object({
  customerId: idSchema,
  orderId: idSchema,
  reason: z.enum(REFUND_REASONS).default('other'),
  message: z.string().trim().max(2000).optional().nullable(),
  items: z.array(z.object({ orderItemId: idSchema, quantity: z.number().int().positive().max(1000) })).min(1).max(50),
}).superRefine((body, context) => {
  const ids = body.items.map((item) => item.orderItemId);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', path: ['items'], message: 'Each order item can only be selected once.' });
});

export const adminRefundListQuery = z.object({
  status: z.enum(REFUND_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const customerMessageBody = z.object({
  customerId: idSchema,
  message: z.string().trim().min(1).max(2000),
});

export const verificationMessageBody = z.object({
  message: z.string().trim().min(1).max(2000),
});

export const decisionReasonBody = z.object({
  reason: z.string().trim().min(1).max(2000),
});
