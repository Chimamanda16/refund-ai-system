import * as refundRepository from '../repositories/refundRepository.js';
import * as customerRepository from '../repositories/customerRepository.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import { classifyRefundRequest } from './aiService.js';
import { evaluatePolicy } from './policyService.js';

export async function submitRefund(payload) {
  const order = await refundRepository.findOrderContext(payload.orderId, payload.customerId);
  if (!order) throw new NotFoundError('Order for customer');
  const orderItems = await refundRepository.findOrderItems(order.id);
  const resolvedItems = [];
  for (const requested of payload.items) {
    const item = orderItems.find((candidate) => candidate.id === requested.orderItemId);
    if (!item) throw new AppError(400, 'ITEM_NOT_IN_ORDER', `Item ${requested.orderItemId} does not belong to this order.`);
    const hasExistingRequest = await refundRepository.hasExistingRefundRequest(item.id);
    if (hasExistingRequest) throw new AppError(409, 'ITEM_ALREADY_REQUESTED', `A refund has already been requested for "${item.productName}".`);
    if (requested.quantity > item.quantity) throw new AppError(400, 'INVALID_QUANTITY', `The requested quantity for "${item.productName}" exceeds the order quantity.`);
    resolvedItems.push({ ...item, requestedQuantity: requested.quantity, lineAmount: Number((item.unitPrice * requested.quantity).toFixed(2)) });
  }
  const amount = Number(resolvedItems.reduce((sum, item) => sum + item.lineAmount, 0).toFixed(2));
  if (amount <= 0) throw new AppError(400, 'INVALID_AMOUNT', 'Selected items must have a refundable value.');
  const [customer, history] = await Promise.all([customerRepository.findById(payload.customerId), refundRepository.findRefundHistory(payload.customerId)]);
  if (!customer) throw new NotFoundError('Customer');
  const aiResult = await classifyRefundRequest({ order, orderItems, selectedItems: resolvedItems, refundHistory: history, customerMessage: payload.message });
  const policy = evaluatePolicy({ isRequestValid: true, legitimateAmount: amount, hasFinalSaleItem: resolvedItems.some((item) => item.isFinalSale), orderCreatedAt: order.orderDate, aiResult });
  const id = await refundRepository.createWithAudit({ customerId: customer.id, orderId: order.id, amount, reason: payload.reason, message: payload.message?.trim() || null, items: resolvedItems, ai: aiResult.valid ? aiResult.classification : null, decision: policy.decision, policyCode: policy.code, policyReason: policy.reason });
  return getRefundForCustomer(id, customer.id);
}

function getCustomerResponse(status, lastSender) {
  if (status === 'approved') return 'Your refund request has been approved.';
  if (status === 'denied') return 'Your refund request was not approved. Contact support if you believe more information could help.';
  if (status === 'pending' && lastSender === 'admin') return 'Support needs a little more information to continue reviewing your request.';
  if (status === 'pending' && lastSender === 'customer') return 'Your response was received. Support will continue reviewing your request.';
  if (status === 'pending') return 'Your request is pending with support.';
  return 'Your request has been sent to support for review. We will update you here.';
}

export async function listCustomerRefunds(customerId) {
  const customer = await customerRepository.findById(customerId);
  if (!customer) throw new NotFoundError('Customer');
  return refundRepository.findCustomerHistory(customerId);
}

export async function getRefundForCustomer(refundId, customerId) {
  const refund = await refundRepository.findCustomerViewById(refundId, customerId);
  if (!refund) throw new NotFoundError('Refund request');
  const [items, messages] = await Promise.all([refundRepository.findItems(refundId), refundRepository.findMessages(refundId)]);
  const lastSender = messages.at(-1)?.senderType;
  return { ...refund, systemResponse: getCustomerResponse(refund.status, lastSender), verificationRequested: refund.status === 'pending' && lastSender === 'admin', awaitingSupport: refund.status === 'pending' && lastSender === 'customer', items, messages };
}

export async function replyToVerification(refundId, { customerId, message }) {
  const id = await refundRepository.addCustomerMessage(refundId, customerId, message);
  if (!id) throw new NotFoundError('Refund request');
  return getRefundForCustomer(id, customerId);
}
