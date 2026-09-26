import * as refundService from '../services/refundService.js';

export async function createRefund(req, res) {
  const refund = await refundService.submitRefund(req.validated.body);
  res.status(201).json({ data: refund });
}

export async function getRefund(req, res) {
  const { refundId } = req.validated.params;
  res.json({ data: await refundService.getRefundForCustomer(refundId) });
}
