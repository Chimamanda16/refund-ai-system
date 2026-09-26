import { useState } from 'react';
import { api } from '../lib/apiClient.js';
import { capitalize, formatDate, formatMoney } from '../lib/format.js';
import { useAsync } from '../hooks/useAsync.js';
import { ErrorNotice, LoadingNotice } from '../components/Notice.jsx';

function OrderCard({ order }) {
  return (
    <article className="card">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="type-card-title">{order.orderNumber}</h3>
        <p className="type-small text-slate">
          {capitalize(order.status)} · Ordered {formatDate(order.orderDate)}
        </p>
      </header>

      <ul className="mt-5 divide-y divide-hairline-silver">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 py-3">
            <div>
              <p>{item.productName}</p>
              <p className="type-small text-slate">
                {item.sku} · Qty {item.quantity}
              </p>
              {item.isFinalSale && <p className="type-label font-semibold text-launch-orange">Final sale</p>}
            </div>
            <p className="whitespace-nowrap">{formatMoney(item.lineTotal, order.currency)}</p>
          </li>
        ))}
      </ul>

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Total {formatMoney(order.totalAmount, order.currency)}</p>
        <button type="button" className="pill-disabled" disabled>
          Request a refund
        </button>
      </footer>
    </article>
  );
}

export default function CustomerRefundPage() {
  const [customerId, setCustomerId] = useState('');
  const customers = useAsync((signal) => api.getCustomers(signal), []);
  const orders = useAsync(
    (signal) => (customerId ? api.getCustomerOrders(customerId, signal) : Promise.resolve(null)),
    [customerId],
  );

  return (
    <>
      <section className="px-6 pb-24 pt-20 text-center">
        <p className="type-label font-semibold text-launch-orange">Coming in the next phase</p>
        <p className="type-kicker mt-4">Refund support</p>
        <h1 className="type-hero mx-auto mt-3 max-w-3xl">Returns, made simple.</h1>
        <p className="mx-auto mt-6 max-w-xl text-slate">
          Choose your order, tell us what went wrong, and get a response.
        </p>
        <a href="#orders" className="pill-blue-lg mt-8">Find your order</a>
      </section>

      <section id="orders" className="bg-studio-mist px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="type-feature">Find your order</h2>
          <label htmlFor="customer" className="type-small mt-8 block text-slate">Sample customer</label>
          <select
            id="customer"
            className="field mt-2 max-w-md"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            disabled={customers.loading || Boolean(customers.error)}
          >
            <option value="">{customers.loading ? 'Loading customers…' : 'Select a customer'}</option>
            {customers.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="mt-10 space-y-5">
            {customers.error && <ErrorNotice error={customers.error} />}
            {customerId && orders.loading && <LoadingNotice>Loading orders…</LoadingNotice>}
            {orders.error && <ErrorNotice error={orders.error} />}
            {orders.data?.orders.length === 0 && <p className="text-slate">This customer has no orders yet.</p>}
            {orders.data?.orders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>
      </section>
    </>
  );
}
