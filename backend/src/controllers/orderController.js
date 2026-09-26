import * as orderService from '../services/orderService.js';

export async function getOrder(req, res) {
  const { orderId } = req.validated.params;
  res.json({ data: await orderService.getOrder(orderId) });
}
