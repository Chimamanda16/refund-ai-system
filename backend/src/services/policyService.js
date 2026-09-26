const REFUND_WINDOW_DAYS = Number(process.env.REFUND_WINDOW_DAYS || 30);
const ESCALATION_AMOUNT_THRESHOLD = Number(process.env.ESCALATION_AMOUNT_THRESHOLD || 500);
export const DECISIONS = Object.freeze({ APPROVED: 'approved', DENIED: 'denied', ESCALATED: 'escalated' });
const QUALIFYING_CATEGORIES = new Set(['damaged_item', 'incorrect_item']);

export function evaluatePolicy({ isRequestValid, invalidReason, legitimateAmount, hasFinalSaleItem, orderCreatedAt, aiResult }) {
  if (!isRequestValid) return { decision: DECISIONS.DENIED, code: 'INVALID_REQUEST', reason: invalidReason || 'The request could not be validated against order data.' };
  if (!aiResult.valid || aiResult.classification.suspicious || aiResult.classification.conflicts.length) {
    return { decision: DECISIONS.ESCALATED, code: 'SUSPICIOUS_OR_CONFLICTING', reason: 'This request needs a human review.' };
  }
  if (legitimateAmount > ESCALATION_AMOUNT_THRESHOLD) return { decision: DECISIONS.ESCALATED, code: 'AMOUNT_ABOVE_THRESHOLD', reason: `Requests above $${ESCALATION_AMOUNT_THRESHOLD.toFixed(2)} are sent for review.` };
  if (hasFinalSaleItem) return { decision: DECISIONS.DENIED, code: 'FINAL_SALE_ITEM', reason: 'One or more selected items are final sale.' };
  if ((Date.now() - new Date(orderCreatedAt).getTime()) / 86400000 > REFUND_WINDOW_DAYS) return { decision: DECISIONS.DENIED, code: 'OUTSIDE_REFUND_WINDOW', reason: `The order was placed more than ${REFUND_WINDOW_DAYS} days ago.` };
  if (QUALIFYING_CATEGORIES.has(aiResult.classification.category)) return { decision: DECISIONS.APPROVED, code: 'QUALIFYING_CATEGORY', reason: 'The reported issue qualifies for an automatic refund within the return window.' };
  return { decision: DECISIONS.ESCALATED, code: 'NEEDS_HUMAN_REVIEW', reason: 'This request needs a human review.' };
}
