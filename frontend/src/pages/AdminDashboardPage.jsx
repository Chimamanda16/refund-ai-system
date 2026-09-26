import { api } from '../lib/apiClient.js';
import { useState } from 'react';
import { formatDate, formatMoney, capitalize } from '../lib/format.js';
import { useAsync } from '../hooks/useAsync.js';
import { ErrorNotice, LoadingNotice } from '../components/Notice.jsx';

const STATUSES = ['pending', 'approved', 'denied', 'escalated'];

function StatCard({ label, value }) {
  return (
    <div className="card">
      <p className="type-small text-slate">{label}</p>
      <p className="type-feature mt-2">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const dashboard = useAsync((signal) => api.getAdminDashboard(signal), []);
  const refunds = useAsync((signal) => api.getAdminRefunds(signal), []);

  async function inspectRefund(id) {
    setLoadingDetail(true); setDetailError(null);
    setVerificationMessage(''); setVerificationError(null);
    try { setDetail(await api.getAdminRefund(id)); } catch (error) { setDetailError(error); } finally { setLoadingDetail(false); }
  }

  async function askForVerification(event) {
    event.preventDefault();
    if (!detail || !verificationMessage.trim()) return;
    setSendingVerification(true); setVerificationError(null);
    try {
      setDetail(await api.requestVerification(detail.id, verificationMessage.trim()));
      setVerificationMessage('');
    } catch (error) { setVerificationError(error); }
    finally { setSendingVerification(false); }
  }

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20">
        <p className="type-kicker">Admin</p>
        <h1 className="type-hero mt-3">Refund requests</h1>
        <p className="mt-6 max-w-xl text-slate">
          Review refund requests and their automated decision signals.
        </p>
      </section>

      <section className="bg-studio-mist px-6 py-16">
        <div className="mx-auto max-w-5xl">
          {dashboard.loading && <LoadingNotice />}
          {dashboard.error && <ErrorNotice error={dashboard.error} />}
          {dashboard.data && (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {STATUSES.map((status) => (
                <StatCard key={status} label={capitalize(status)} value={dashboard.data.byStatus[status]} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="type-feature">Recent requests</h2>
        <div className="mt-8">
          {refunds.loading && <LoadingNotice />}
          {refunds.error && <ErrorNotice error={refunds.error} />}
          {refunds.data?.length === 0 && <p className="text-slate">No refund requests yet.</p>}
          {refunds.data?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="type-small text-slate">
                  <tr className="border-b border-hairline-silver">
                    <th className="py-3 pr-4 font-normal">Customer</th>
                    <th className="py-3 pr-4 font-normal">Order</th>
                    <th className="py-3 pr-4 font-normal">Amount</th>
                    <th className="py-3 pr-4 font-normal">Submitted</th>
                    <th className="py-3 pr-4 font-normal">Status</th>
                    <th className="py-3 font-normal">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.data.map((r) => (
                    <tr key={r.id} className="border-b border-hairline-silver">
                      <td className="py-4 pr-4">{r.customerName}</td>
                      <td className="py-4 pr-4">{r.orderNumber}</td>
                      <td className="py-4 pr-4">{formatMoney(r.requestedAmount)}</td>
                      <td className="py-4 pr-4 text-slate">{formatDate(r.createdAt)}</td>
                      <td className="py-4 pr-4">
                        <span className={r.status === 'escalated' ? 'font-semibold text-launch-orange' : ''}>
                          {capitalize(r.status)}
                        </span>
                        {r.aiSuspicious && <span className="type-label ml-2 text-launch-orange">Flagged</span>}
                      </td>
                      <td className="py-4"><button type="button" onClick={() => inspectRefund(r.id)}>Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {loadingDetail && <div className="mt-6"><LoadingNotice>Loading request details…</LoadingNotice></div>}
          {detailError && <div className="mt-6"><ErrorNotice error={detailError} /></div>}
          {detail && <article className="card mt-8">
            <div className="flex items-start justify-between gap-4"><div><h3 className="type-card-title">Request {detail.id} · {capitalize(detail.status)}</h3><p className="type-small mt-2 text-slate">{detail.customerName} · {detail.customerEmail} · {detail.orderNumber}</p></div><button type="button" onClick={() => setDetail(null)}>Close</button></div>
            <p className="mt-4">{detail.policyReason || detail.reason}</p>
            {detail.aiCategory && <p className="type-small mt-3 text-slate">AI: {detail.aiCategory} · confidence {detail.aiConfidence ?? '—'}{detail.aiSuspicious ? ' · flagged' : ''}</p>}
            <ul className="mt-4 divide-y divide-hairline-silver">{detail.items?.map((item) => <li key={item.id} className="py-2">{item.productName} · Qty {item.requestedQuantity} · {formatMoney(item.requestedAmount)}</li>)}</ul>
            {detail.auditLogs?.length > 0 && <div className="mt-4"><h4 className="font-semibold">Audit history</h4><ul className="mt-2 space-y-2">{detail.auditLogs.map((event) => <li key={event.id} className="type-small text-slate">{event.action} · {formatDate(event.createdAt)}{event.reason ? ` · ${event.reason}` : ''}</li>)}</ul></div>}
            {['pending', 'escalated'].includes(detail.status) && <form className="mt-6 border-t border-hairline-silver pt-5" onSubmit={askForVerification}><label className="block text-sm font-semibold" htmlFor="verification-message">Request more information</label><p className="type-small mt-1 text-slate">This message will be visible to the customer and move the request to pending.</p><textarea id="verification-message" className="field mt-3 min-h-24 resize-y rounded-2xl" maxLength="2000" value={verificationMessage} onChange={(event) => setVerificationMessage(event.target.value)} required placeholder="Explain what information support needs." />{verificationError && <div className="mt-3"><ErrorNotice error={verificationError} /></div>}<button className="pill-blue mt-3" type="submit" disabled={sendingVerification || !verificationMessage.trim()}>{sendingVerification ? 'Sending…' : 'Send verification request'}</button></form>}
          </article>}
        </div>
      </section>
    </>
  );
}
