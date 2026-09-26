import { api } from '../lib/apiClient.js';
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
  const dashboard = useAsync((signal) => api.getAdminDashboard(signal), []);
  const refunds = useAsync((signal) => api.getAdminRefunds(signal), []);

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20">
        <p className="type-kicker">Admin</p>
        <h1 className="type-hero mt-3">Refund requests</h1>
        <p className="mt-6 max-w-xl text-slate">
          A live count by status. Review, approve and deny actions arrive with the refund engine.
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
                    <th className="py-3 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.data.map((r) => (
                    <tr key={r.id} className="border-b border-hairline-silver">
                      <td className="py-4 pr-4">{r.customerName}</td>
                      <td className="py-4 pr-4">{r.orderNumber}</td>
                      <td className="py-4 pr-4">{formatMoney(r.requestedAmount)}</td>
                      <td className="py-4 pr-4 text-slate">{formatDate(r.createdAt)}</td>
                      <td className="py-4">
                        <span className={r.status === 'escalated' ? 'font-semibold text-launch-orange' : ''}>
                          {capitalize(r.status)}
                        </span>
                        {r.aiSuspicious && <span className="type-label ml-2 text-launch-orange">Flagged</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
