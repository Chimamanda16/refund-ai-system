import * as refundRepository from '../repositories/refundRepository.js';
import { NotFoundError, NotImplementedError } from '../utils/errors.js';

/**
 * Phase 1 placeholder. Phase 2+ will: verify the order belongs to the customer,
 * validate items/amounts, call AI triage, run the policy engine, and persist the
 * request + audit log inside one transaction.
 */
export async function submitRefund(_input) {
  throw new NotImplementedError('Refund submission is not available yet (Phase 2).');
}

/** Customer-facing view: no admin notes, audit logs, AI fields or policy internals. */
export async function getRefundForCustomer(refundId) {
  const refund = await refundRepository.findCustomerViewById(refundId);
  if (!refund) throw new NotFoundError('Refund request');
  const [items, messages] = await Promise.all([
    refundRepository.findItems(refundId),
    refundRepository.findMessages(refundId),
  ]);
  return { ...refund, items, messages };
}
