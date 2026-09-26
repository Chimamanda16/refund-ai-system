export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(`Cannot reach the API at ${API_URL}`);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(error?.message ?? `Request failed (${response.status})`, {
      status: response.status,
      code: error?.code,
      details: error?.details,
    });
  }
  // Endpoints wrap results in { data }. /health returns its own shape.
  return payload?.data ?? payload;
}

export const api = {
  getHealth: (signal) => request('/health', { signal }),
  getCustomers: (signal) => request('/customers', { signal }),
  getCustomerOrders: (customerId, signal) => request(`/customers/${customerId}/orders`, { signal }),
  getOrder: (orderId, signal) => request(`/orders/${orderId}`, { signal }),
  createRefund: (input) => request('/refunds', { method: 'POST', body: input }),
  getRefund: (refundId, signal) => request(`/refunds/${refundId}`, { signal }),
  getAdminDashboard: (signal) => request('/admin/dashboard', { signal }),
  getAdminRefunds: (signal) => request('/admin/refunds', { signal }),
  getAdminRefund: (refundId, signal) => request(`/admin/refunds/${refundId}`, { signal }),
};
