import * as customerRepository from '../repositories/customerRepository.js';
import * as orderRepository from '../repositories/orderRepository.js';
import { NotFoundError } from '../utils/errors.js';

function groupItemsByOrder(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.orderId)) map.set(item.orderId, []);
    map.get(item.orderId).push(item);
  }
  return map;
}

export async function getOrdersForCustomer(customerId) {
  const customer = await customerRepository.findById(customerId);
  if (!customer) throw new NotFoundError('Customer');

  const orders = await orderRepository.findByCustomerId(customerId);
  const items = await orderRepository.findItemsByOrderIds(orders.map((o) => o.id));
  const byOrder = groupItemsByOrder(items);

  return {
    customer,
    orders: orders.map((order) => ({ ...order, items: byOrder.get(order.id) ?? [] })),
  };
}

export async function getOrder(orderId) {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new NotFoundError('Order');
  const items = await orderRepository.findItemsByOrderIds([orderId]);
  return { ...order, items };
}
