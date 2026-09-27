import * as adminRepository from '../repositories/adminRepository.js';
import * as refundRepository from '../repositories/refundRepository.js';
import { REFUND_STATUSES } from '../validators/refund.validators.js';
import { NotFoundError } from '../utils/errors.js';

export async function getDashboard() {
  const rows = await adminRepository.countRefundsByStatus();
  const byStatus = Object.fromEntries(REFUND_STATUSES.map((s) => [s, 0]));
  for (const { status, count } of rows) byStatus[status] = count;
  const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  return { totalRefunds: total, byStatus };
}

export function listRefunds(filters) {
  return adminRepository.listRefunds(filters);
}

export async function getRefundDetail(refundId) {
  const refund = await adminRepository.findRefundById(refundId);
  if (!refund) throw new NotFoundError('Refund request');
  const [items, messages, notes, auditLogs] = await Promise.all([
    refundRepository.findItems(refundId),
    refundRepository.findMessages(refundId),
    adminRepository.findNotes(refundId),
    adminRepository.findAuditLogs(refundId),
  ]);
  return { ...refund, items, messages, notes, auditLogs };
}

export async function requestVerification(refundId, message) {
  const updated = await adminRepository.requestVerification(refundId, message);
  if (!updated) throw new NotFoundError('Open refund request');
  return getRefundDetail(refundId);
}

export async function approveRefund(refundId) {
  const updated = await adminRepository.approveRefund(refundId);
  if (!updated) throw new NotFoundError('Open refund request');
  return getRefundDetail(refundId);
}

export async function rejectRefund(refundId) {
  const updated = await adminRepository.rejectRefund(refundId);
  if (!updated) throw new NotFoundError('Open refund request');
  return getRefundDetail(refundId);
}