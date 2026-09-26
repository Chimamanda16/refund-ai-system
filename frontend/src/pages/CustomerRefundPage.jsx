import { useState } from 'react';
import { api } from '../lib/apiClient.js';
import { capitalize, formatDate, formatMoney } from '../lib/format.js';
import { useAsync } from '../hooks/useAsync.js';
import { ErrorNotice, LoadingNotice } from '../components/Notice.jsx';

const reasons = ['damaged', 'incorrect_item', 'not_delivered', 'not_as_described', 'changed_mind', 'other'];

function StatusLabel({ status }) {
  const label = status === 'escalated' ? 'Escalated · support review' : status === 'pending' ? 'Pending · action needed' : capitalize(status);
  return <span className="inline-flex rounded-full border border-hairline-silver px-3 py-1 text-sm font-medium">{label}</span>;
}

function SectionHeading({ step, title, children }) {
  return <div className="mb-5"><p className="type-label font-semibold uppercase tracking-wide text-slate">{step}</p><h2 className="type-feature mt-2">{title}</h2>{children && <p className="mt-2 text-slate">{children}</p>}</div>;
}

export default function CustomerRefundPage() {
  const [customerId, setCustomerId] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [reason, setReason] = useState('damaged');
  const [message, setMessage] = useState('');
  const [stage, setStage] = useState('select');
  const [submission, setSubmission] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const customers = useAsync((signal) => api.getCustomers(signal), []);
  const orders = useAsync((signal) => customerId ? api.getCustomerOrders(customerId, signal) : Promise.resolve(null), [customerId]);
  const history = useAsync((signal) => customerId ? api.getCustomerRefunds(customerId, signal) : Promise.resolve(null), [customerId, historyRefresh]);
  const selectedOrder = orders.data?.orders.find((order) => String(order.id) === String(selectedOrderId));
  const requestedItems = selectedOrder?.items.filter((item) => Number(selectedItems[item.id]) > 0).map((item) => ({ ...item, requestedQuantity: Number(selectedItems[item.id]) })) ?? [];
  const estimatedAmount = requestedItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.requestedQuantity, 0);

  function changeCustomer(value) {
    setCustomerId(value); setSelectedOrderId(''); setSelectedItems({}); setStage('select'); setSubmission(null); setDetail(null);
  }

  function chooseOrder(orderId) {
    setSelectedOrderId(String(orderId)); setSelectedItems({}); setStage('items'); setSubmitError(null);
  }

  function quantityFor(item, value) {
    const quantity = Math.max(0, Math.min(item.remainingQuantity ?? item.quantity, Number(value) || 0));
    setSelectedItems((current) => ({ ...current, [item.id]: quantity }));
  }

  async function submitRequest() {
    if (!selectedOrder || !requestedItems.length || !message.trim()) {
      setSubmitError(new Error('Select at least one available item and explain what happened.'));
      setStage('items');
      return;
    }
    setSubmitting(true); setSubmitError(null);
    try {
      const result = await api.createRefund({
        customerId: Number(customerId), orderId: selectedOrder.id, reason, message: message.trim(),
        items: requestedItems.map((item) => ({ orderItemId: item.id, quantity: item.requestedQuantity })),
      });
      setSubmission(result); setStage('result'); setHistoryRefresh((value) => value + 1);
    } catch (error) { setSubmitError(error); setStage('review'); }
    finally { setSubmitting(false); }
  }

  async function openRequest(refundId) {
    setDetail(null); setDetailError(null); setDetailLoading(true); setReplyError(null); setReply('');
    try { setDetail(await api.getRefund(refundId, customerId)); }
    catch (error) { setDetailError(error); }
    finally { setDetailLoading(false); }
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!detail || !reply.trim()) return;
    setReplying(true); setReplyError(null);
    try {
      setDetail(await api.replyToVerification(detail.id, { customerId: Number(customerId), message: reply.trim() }));
      setReply(''); setHistoryRefresh((value) => value + 1);
    } catch (error) { setReplyError(error); }
    finally { setReplying(false); }
  }

  return <>
    <section className="px-5 pb-12 pt-14 text-center sm:px-6 sm:pb-16 sm:pt-20">
      <p className="type-kicker">Refund support</p>
      <h1 className="type-hero mx-auto mt-3 max-w-3xl">Returns, made simple.</h1>
      <p className="mx-auto mt-5 max-w-xl text-slate">Choose an order, tell us what happened, and follow your request in one place.</p>
    </section>

    <section className="bg-studio-mist px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]">
        <div className="space-y-6">
          <article className="card p-5 sm:p-7">
            <SectionHeading step="Start here" title="Find your orders" />
            <label htmlFor="customer" className="type-small block text-slate">Select customer</label>
            <select id="customer" className="field mt-2 max-w-xl" value={customerId} onChange={(event) => changeCustomer(event.target.value)} disabled={customers.loading || Boolean(customers.error)}>
              <option value="">{customers.loading ? 'Loading customers…' : 'Select customer'}</option>
              {customers.data?.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            {customers.error && <div className="mt-4"><ErrorNotice error={customers.error} /></div>}
            {customerId && orders.loading && <div className="mt-5"><LoadingNotice>Loading orders…</LoadingNotice></div>}
            {customerId && orders.error && <div className="mt-5"><ErrorNotice error={orders.error} /></div>}
            {customerId && orders.data?.orders.length === 0 && <p className="mt-5 text-slate">No orders were found for this customer.</p>}
            <div className="mt-5 space-y-4">
              {orders.data?.orders.map((order) => <article key={order.id} className={`rounded-2xl border p-4 sm:p-5 ${String(order.id) === String(selectedOrderId) ? 'border-pricing-blue bg-[#f5faff]' : 'border-hairline-silver bg-white'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="type-card-title">{order.orderNumber}</h3><p className="type-small mt-1 text-slate">{formatDate(order.orderDate)} · {capitalize(order.status)}</p></div>
                  <p className="font-semibold">{formatMoney(order.totalAmount, order.currency)}</p>
                </div>
                <ul className="mt-3 divide-y divide-hairline-silver">
                  {order.items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>{item.productName} <span className="text-slate">· Qty {item.quantity} · {formatMoney(item.unitPrice, order.currency)} each</span>{item.isFinalSale && <span className="ml-2 font-medium text-launch-orange">Final sale</span>}</span>
                    <span className="text-slate">{item.remainingQuantity} available</span>
                  </li>)}
                </ul>
                <button type="button" className="pill-outline mt-4" onClick={() => chooseOrder(order.id)}>{String(order.id) === String(selectedOrderId) ? 'Selected order' : 'Select this order'}</button>
              </article>)}
            </div>
          </article>

          {selectedOrder && (stage === 'items' || stage === 'review') && <article className="card p-5 sm:p-7">
            <SectionHeading step="Request details" title="Choose items and explain" >Order {selectedOrder.orderNumber}</SectionHeading>
            <div className="space-y-3">
              {selectedOrder.items.map((item) => {
                const remaining = item.remainingQuantity ?? item.quantity;
                return <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-hairline-silver p-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-start gap-3"><input className="mt-1 h-5 w-5 accent-[#0071e3]" type="checkbox" checked={Number(selectedItems[item.id] ?? 0) > 0} disabled={remaining < 1} onChange={(event) => quantityFor(item, event.target.checked ? 1 : 0)} /><span><span className="block font-medium">{item.productName}</span><span className="type-small text-slate">Qty {item.quantity} · {formatMoney(item.unitPrice, selectedOrder.currency)} each{item.isFinalSale ? ' · Final sale' : ''}</span></span></label>
                  <label className="type-small flex items-center gap-2 text-slate">Quantity <input aria-label={`Quantity for ${item.productName}`} className="field max-w-24 px-3 py-2" type="number" min="0" max={remaining} value={selectedItems[item.id] ?? 0} disabled={remaining < 1} onChange={(event) => quantityFor(item, event.target.value)} /><span>of {remaining}</span></label>
                </div>;
              })}
            </div>
            <p className="mt-4 text-sm text-slate">Estimated refund: <strong className="text-ink">{formatMoney(estimatedAmount, selectedOrder.currency)}</strong>.</p>
            <label className="mt-5 block text-sm font-medium" htmlFor="reason">Reason</label>
            <select id="reason" className="field mt-2" value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((value) => <option key={value} value={value}>{capitalize(value.replaceAll('_', ' '))}</option>)}</select>
            <label className="mt-5 block text-sm font-medium" htmlFor="explanation">What happened?</label>
            <textarea id="explanation" className="field mt-2 min-h-32 resize-y rounded-2xl" maxLength="2000" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe the problem in your own words." />
            {submitError && stage === 'items' && <div className="mt-4"><ErrorNotice error={submitError} /></div>}
            <div className="mt-5 flex flex-wrap gap-3"><button type="button" className="pill-blue-lg" onClick={() => { if (!requestedItems.length || !message.trim()) setSubmitError(new Error('Select at least one available item and explain what happened.')); else { setSubmitError(null); setStage('review'); } }}>Review request</button><button type="button" className="pill-outline" onClick={() => { setSelectedOrderId(''); setSelectedItems({}); setStage('select'); }}>Choose another order</button></div>
          </article>}

          {stage === 'review' && selectedOrder && <article className="card border-2 border-pricing-blue p-5 sm:p-7">
            <SectionHeading step="Before you submit" title="Review your request" />
            {submitError && <div className="mb-4"><ErrorNotice error={submitError} /></div>}
            <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-slate">Order</dt><dd className="font-medium">{selectedOrder.orderNumber} · {formatDate(selectedOrder.orderDate)}</dd></div><div><dt className="text-slate">Estimated amount</dt><dd className="font-medium">{formatMoney(estimatedAmount, selectedOrder.currency)}</dd></div></dl>
            <ul className="mt-4 divide-y divide-hairline-silver">{requestedItems.map((item) => <li key={item.id} className="flex justify-between gap-3 py-3"><span>{item.productName} · Qty {item.requestedQuantity}</span><span>{formatMoney(Number(item.unitPrice) * item.requestedQuantity, selectedOrder.currency)}</span></li>)}</ul>
            <p className="mt-4 text-sm"><span className="text-slate">Reason:</span> {capitalize(reason.replaceAll('_', ' '))}</p><p className="mt-2 whitespace-pre-wrap text-sm"><span className="text-slate">Your explanation:</span> {message}</p>
            <div className="mt-6 flex flex-wrap gap-3"><button type="button" className="pill-blue-lg" disabled={submitting} onClick={submitRequest}>{submitting ? 'Submitting…' : 'Submit refund request'}</button><button type="button" className="pill-outline" onClick={() => setStage('items')}>Edit request</button></div>
          </article>}

          {stage === 'result' && submission && <article className="card border-2 border-pricing-blue p-5 sm:p-7" role="status">
            <SectionHeading step="Request submitted" title={`Request #${submission.id}`} />
            <StatusLabel status={submission.status} />
            <p className="mt-4">{submission.systemResponse}</p>
            <p className="mt-2 text-sm text-slate">Requested amount: {formatMoney(submission.requestedAmount, selectedOrder?.currency)}</p>
            {submission.status === 'escalated' && <p className="mt-3 rounded-xl bg-studio-mist p-4">This request needs support review. You can follow updates in Request history.</p>}
            <button type="button" className="pill-blue mt-5" onClick={() => { setStage('select'); setSelectedOrderId(''); setSelectedItems({}); setMessage(''); }}>Start another request</button>
          </article>}
        </div>

        <aside className="space-y-6">
          <section className="card p-5 sm:p-7">
            <SectionHeading step="Your account" title="Request history" />
            {!customerId && <p className="text-sm text-slate">Select a customer to view submitted requests.</p>}
            {customerId && history.loading && <LoadingNotice>Loading request history…</LoadingNotice>}
            {history.error && <ErrorNotice error={history.error} />}
            {customerId && history.data?.length === 0 && <p className="text-sm text-slate">You have not submitted any refund requests.</p>}
            <ul className="divide-y divide-hairline-silver">{history.data?.map((request) => <li key={request.id} className="py-3">
              <button type="button" className="w-full text-left" onClick={() => openRequest(request.id)}><span className="flex flex-wrap items-center justify-between gap-2"><strong>Request #{request.id}</strong><StatusLabel status={request.status} /></span><span className="type-small mt-1 block text-slate">{request.orderNumber} · {formatMoney(request.requestedAmount)} · {formatDate(request.createdAt)}</span></button>
            </li>)}</ul>
          </section>

          {(detail || detailLoading || detailError) && <section className="card p-5 sm:p-7" aria-live="polite">
            <div className="flex items-start justify-between gap-3"><SectionHeading step="Request details" title={detail ? `Request #${detail.id}` : 'Request'} /><button className="type-small link-apple" type="button" onClick={() => setDetail(null)}>Close</button></div>
            {detailLoading && <LoadingNotice>Loading request…</LoadingNotice>}
            {detailError && <ErrorNotice error={detailError} />}
            {detail && <>
              <StatusLabel status={detail.status} />
              <p className="mt-4">{detail.systemResponse}</p>
              <dl className="mt-4 space-y-2 text-sm"><div><dt className="inline text-slate">Order: </dt><dd className="inline">{detail.orderNumber} · {formatDate(detail.orderDate)} · {capitalize(detail.orderStatus)}</dd></div><div><dt className="inline text-slate">Amount: </dt><dd className="inline">{formatMoney(detail.requestedAmount, detail.currency)}</dd></div><div><dt className="inline text-slate">Reason: </dt><dd className="inline">{capitalize(detail.reason.replaceAll('_', ' '))}</dd></div></dl>
              <ul className="mt-3 divide-y divide-hairline-silver">{detail.items.map((item) => <li key={item.id} className="py-2 text-sm">{item.productName} · Qty {item.requestedQuantity} · {formatMoney(item.requestedAmount, detail.currency)}</li>)}</ul>
              {detail.customerMessage && <div className="mt-3 rounded-xl bg-studio-mist p-3"><p className="type-label text-slate">Your original explanation</p><p className="mt-1 whitespace-pre-wrap text-sm">{detail.customerMessage}</p></div>}
              <h3 className="mt-5 font-semibold">Conversation</h3>
              {detail.messages.length === 0 && <p className="mt-2 text-sm text-slate">No messages yet.</p>}
              <ul className="mt-2 space-y-3">{detail.messages.map((entry) => <li key={entry.id} className={`rounded-xl p-3 text-sm ${entry.senderType === 'customer' ? 'bg-[#f5faff]' : 'bg-studio-mist'}`}><p className="type-label mb-1 font-semibold text-slate">{entry.senderType === 'admin' ? 'Support' : entry.senderType === 'customer' ? 'You' : 'Refund update'} · {formatDate(entry.createdAt)}</p><p className="whitespace-pre-wrap">{entry.message}</p></li>)}</ul>
              {detail.verificationRequested ? <form className="mt-5 space-y-3" onSubmit={sendReply}><label htmlFor="verification-reply" className="block text-sm font-medium">Reply to support</label><textarea id="verification-reply" className="field min-h-28 resize-y rounded-2xl" maxLength="2000" value={reply} onChange={(event) => setReply(event.target.value)} required placeholder="Share the requested information." />{replyError && <ErrorNotice error={replyError} />}<button className="pill-blue" disabled={replying || !reply.trim()} type="submit">{replying ? 'Sending…' : 'Send reply'}</button></form> : detail.awaitingSupport && <p className="mt-4 rounded-xl bg-studio-mist p-3 text-sm">Your reply was received. This request is awaiting support review.</p>}
            </>}
          </section>}
        </aside>
      </div>
    </section>
  </>;
}
