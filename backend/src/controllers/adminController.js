import * as adminService from '../services/adminService.js';

export async function getDashboard(_req, res) {
  res.json({ data: await adminService.getDashboard() });
}

export async function listRefunds(req, res) {
  res.json({ data: await adminService.listRefunds(req.validated.query) });
}

export async function getRefund(req, res) {
  const { refundId } = req.validated.params;
  res.json({ data: await adminService.getRefundDetail(refundId) });
}
