import { api } from '../lib/apiClient.js';
import { useState } from 'react';
import { formatDate, formatMoney, capitalize } from '../lib/format.js';
import { useAsync } from '../hooks/useAsync.js';
import { ErrorNotice, LoadingNotice } from '../components/Notice.jsx';

const STATUSES = ['pending', 'approved', 'denied', 'escalated'];

const STATUS_ICON = {
  pending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  approved: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12.5l2.3 2.3L16 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  denied: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  escalated: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 4h9.5l-1.8 3.2L15.5 10H6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
};

const STATUS_TONE = {
  pending: { bg: 'var(--color-warning-bg)', fg: 'var(--color-warning)' },
  approved: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)' },
  denied: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)' },
  escalated: { bg: 'var(--color-warning-bg)', fg: 'var(--color-warning)' },
};

function initialsFor(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—';
}

function StatCard({ label, value, status }) {
  const tone = STATUS_TONE[status];
  return (
    <div className="stat-card">
      <div>
        <p className="type-small text-slate">{label}</p>
        <p className="type-feature mt-1">{value}</p>
      </div>
      {tone && (
        <span className="stat-icon" style={{ background: tone.bg, color: tone.fg }}>
          {STATUS_ICON[status]}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`badge-status badge-${status}`}>
      {capitalize(status)}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [actionError, setActionError] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const dashboard = useAsync((signal) => api.getAdminDashboard(signal), [refresh]);
  const refunds = useAsync((signal) => api.getAdminRefunds(signal), [refresh]);

  async function inspectRefund(id) {
    setLoadingDetail(true); setDetailError(null);
    setVerificationMessage(''); setVerificationError(null); setDecisionReason(''); setActionError(null); setChatMessage(''); setChatError(null);
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

  async function decideRefund(action) {
    if (!detail || !decisionReason.trim()) return;
    setLoading(true); setDecision(action); setActionError(null);
    try {
      setDetail(action === 'approve' ? await api.approveRefund(detail.id, decisionReason.trim()) : await api.rejectRefund(detail.id, decisionReason.trim()));
      setDecisionReason('');
      setRefresh((value) => value + 1);
    } catch (error) { setActionError(error); }
    finally { setLoading(false); setDecision(''); }
  }

  async function sendChat(event) {
    event.preventDefault();
    if (!detail || !chatMessage.trim()) return;
    setSendingChat(true); setChatError(null);
    try { setDetail(await api.sendAdminMessage(detail.id, chatMessage.trim())); setChatMessage(''); }
    catch (error) { setChatError(error); }
    finally { setSendingChat(false); }
  }

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pb-10 pt-16">
        <p className="type-kicker">Admin console</p>
        <h1 className="type-hero mt-3">Refund requests</h1>
        <p className="mt-5 max-w-xl text-slate">
          Review refund requests and their automated decision signals in one place.
        </p>
      </section>

      <section className="bg-studio-mist px-6 py-12">
        <div className="mx-auto max-w-5xl">
          {dashboard.loading && (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {STATUSES.map((status) => (
                <div key={status} className="stat-card">
                  <div className="w-full">
                    <div className="skeleton-line w-16" />
                    <div className="skeleton-line mt-3 w-10" style={{ height: 22 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {dashboard.error && <ErrorNotice error={dashboard.error} />}
          {dashboard.data && (
            <div className="animate-settle grid grid-cols-2 gap-5 lg:grid-cols-4">
              {STATUSES.map((status) => (
                <StatCard key={status} label={capitalize(status)} value={dashboard.data.byStatus[status]} status={status} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="type-feature">Recent requests</h2>
        <div className="mt-7">
          {refunds.loading && <LoadingNotice>Loading requests…</LoadingNotice>}
          {refunds.error && <ErrorNotice error={refunds.error} />}
          {refunds.data?.length === 0 && (
            <div className="empty-state">
              <p className="font-medium">No refund requests yet</p>
              <p className="type-small text-slate">New requests submitted by customers will show up here.</p>
            </div>
          )}
          {refunds.data?.length > 0 && (
            <div className="card-flat overflow-x-auto">
              <table className="table-refunds w-full min-w-[680px] text-left">
                <thead>
                  <tr>
                    <th className="pl-5">Customer</th>
                    <th>Order</th>
                    <th>Amount</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th className="pr-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.data.map((r) => (
                    <tr key={r.id}>
                      <td className="pl-5">
                        <div className="flex items-center gap-3">
                          <span className="avatar-initials">{initialsFor(r.customerName)}</span>
                          <span className="font-medium">{r.customerName}</span>
                        </div>
                      </td>
                      <td className="type-mono-id text-slate">{r.orderNumber}</td>
                      <td className="font-medium">{formatMoney(r.requestedAmount)}</td>
                      <td className="text-slate">{formatDate(r.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={r.status} />
                          {r.aiSuspicious && <span className="badge-flagged">Flagged</span>}
                        </div>
                      </td>
                      <td className="pr-5 text-right">
                        <button className="pill-ghost" type="button" onClick={() => inspectRefund(r.id)}>Review →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {loadingDetail && <div className="mt-6"><LoadingNotice>Loading request details…</LoadingNotice></div>}
          {detailError && <div className="mt-6"><ErrorNotice error={detailError} /></div>}
          {detail && <article className="card animate-settle mt-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="type-card-title">
                  <span className="type-mono-id text-slate">#{detail.id}</span> · {detail.customerName}
                </h3>
                <p className="type-small mt-2 text-slate">{detail.customerEmail} · <span className="type-mono-id">{detail.orderNumber}</span></p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={detail.status} />
                <button className="pill-ghost" type="button" onClick={() => setDetail(null)} aria-label="Close request details">Close</button>
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-studio-mist p-4"><p className="type-label font-semibold text-slate">Automated decision reason</p><p className="mt-1">{detail.policyReason || detail.reason}</p>{detail.resolutionReason && <><p className="type-label mt-3 font-semibold text-slate">Final decision reason</p><p className="mt-1">{detail.resolutionReason}</p></>}</div>
            {detail.aiCategory && (
              <p className="type-small mt-3 flex flex-wrap items-center gap-2 text-slate">
                <span className="rounded-full bg-studio-mist px-2.5 py-1 font-medium text-ink">AI signal</span>
                {detail.aiCategory} · confidence {detail.aiConfidence ?? '—'}
                {detail.aiSuspicious && <span className="badge-flagged">Flagged</span>}
              </p>
            )}
            <ul className="mt-5 divide-y divide-hairline-silver">
              {detail.items?.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>{item.productName} <span className="text-slate">· Qty {item.requestedQuantity}</span></span>
                  <span className="font-medium">{formatMoney(item.requestedAmount)}</span>
                </li>
              ))}
            </ul>
            {detail.auditLogs?.length > 0 && (
              <div className="mt-5 border-t border-hairline-silver pt-5">
                <h4 className="font-semibold">Audit history</h4>
                <ul className="mt-3 space-y-2">
                  {detail.auditLogs.map((event) => (
                    <li key={event.id} className="type-small flex items-start gap-2 text-slate">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-control-gray" />
                      <span>{event.action} · {formatDate(event.createdAt)}{event.reason ? ` · ${event.reason}` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {['pending', 'escalated'].includes(detail.status) && <div className="mt-6 border-t border-hairline-silver pt-6"><label htmlFor="decision-reason" className="block text-sm font-semibold">Decision reason</label><p className="type-small mt-1 text-slate">This explanation will be shown to the customer.</p><textarea id="decision-reason" className="field mt-3 min-h-24 resize-y rounded-2xl" maxLength="2000" required value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} placeholder="Explain the decision." />{actionError && <div className="mt-3"><ErrorNotice error={actionError} /></div>}<div className="mt-3 flex gap-3"><button className="pill-success" type="button" disabled={loading || !decisionReason.trim()} onClick={() => decideRefund('approve')}>{loading && decision === 'approve' ? 'Approving…' : 'Approve refund'}</button><button className="pill-danger-outline" type="button" disabled={loading || !decisionReason.trim()} onClick={() => decideRefund('reject')}>{loading && decision === 'reject' ? 'Rejecting…' : 'Reject refund'}</button></div></div>}
            {false && (detail.status !== "approved") && (detail.status !== "denied") &&
              <div className='mt-6 flex gap-3 border-t border-hairline-silver pt-6'>
                <button className="pill-success" type="submit" disabled={loading} onClick={() => approveRefund(detail.id)}>{loading ? "Working…" : "Accept refund"}</button>
                <button className="pill-danger-outline" type="submit" disabled={loading} onClick={() => rejectRefund(detail.id)}>{loading ? "Working…" : "Reject refund"}</button>
              </div>
            }
            <div className="mt-6 border-t border-hairline-silver pt-6"><h4 className="font-semibold">Request conversation</h4><ul className="mt-3 max-h-72 space-y-3 overflow-y-auto">{detail.messages?.map((entry) => <li key={entry.id} className={`rounded-xl p-3 text-sm ${entry.senderType === 'admin' ? 'bg-[#f5faff]' : 'bg-studio-mist'}`}><p className="type-label mb-1 font-semibold text-slate">{entry.senderType === 'admin' ? 'Support' : 'Customer'} · {formatDate(entry.createdAt)}</p><p className="whitespace-pre-wrap">{entry.message}</p></li>)}</ul>{['pending', 'escalated'].includes(detail.status) && <form className="mt-4 space-y-3" onSubmit={sendChat}><label htmlFor="admin-chat" className="block text-sm font-medium">Message customer</label><textarea id="admin-chat" className="field min-h-24 resize-y rounded-2xl" maxLength="2000" value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} required placeholder="Write a message about this request." />{chatError && <ErrorNotice error={chatError} />}<button className="pill-blue" type="submit" disabled={sendingChat || !chatMessage.trim()}>{sendingChat ? 'Sending…' : 'Send message'}</button></form>}</div>
            {['pending', 'escalated'].includes(detail.status) &&
              <form className="mt-6 border-t border-hairline-silver pt-6" onSubmit={askForVerification}>
                <label className="block text-sm font-semibold" htmlFor="verification-message">Request more information</label>
                <p className="type-small mt-1 text-slate">This message will be visible to the customer and move the request to pending.</p>
                <textarea id="verification-message" className="field mt-3 min-h-24 resize-y rounded-2xl" maxLength="2000" value={verificationMessage} onChange={(event) => setVerificationMessage(event.target.value)} required placeholder="Explain what information support needs." />
                {verificationError && <div className="mt-3"><ErrorNotice error={verificationError} /></div>}
                <button className="pill-blue mt-3" type="submit" disabled={sendingVerification || !verificationMessage.trim()}>
                  {sendingVerification ? 'Sending…' : 'Send verification request'}
                </button>
              </form>
            }
          </article>}
        </div>
      </section>
    </>
  );
}
