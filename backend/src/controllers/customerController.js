import * as customerService from '../services/customerService.js';
import * as orderService from '../services/orderService.js';
import * as refundService from '../services/refundService.js';

export async function listCustomers(_req, res) {
  res.json({ data: await customerService.listCustomers() });
}

export async function listCustomerOrders(req, res) {
  const { customerId } = req.validated.params;
  res.json({ data: await orderService.getOrdersForCustomer(customerId) });
}

export async function listCustomerRefunds(req, res) {
  const { customerId } = req.validated.params;
  res.json({ data: await refundService.listCustomerRefunds(customerId) });
}
