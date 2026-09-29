import { API_URL } from '../lib/apiClient.js';

export function LoadingNotice({ children = 'Loading…' }) {
  return (
    <p className="flex items-center gap-2 text-slate" role="status">
      <svg className="h-4 w-4 animate-spin text-steel" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}

/** Says what went wrong and how to fix it. */
export function ErrorNotice({ error }) {
  const unreachable = error?.code === 'NETWORK_ERROR';
  return (
    <div className="card-flat flex items-start gap-3 border-danger-border p-4" style={{ background: 'var(--color-danger-bg)', borderColor: 'var(--color-danger-border)' }} role="alert">
      <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-danger)' }} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
      <div>
        <p className="font-medium" style={{ color: 'var(--color-danger)' }}>{error?.message}</p>
        {unreachable && (
          <p className="type-small mt-1 text-slate">
            Start the backend (<code>docker compose up</code>) or check that VITE_API_URL points to it.
            Currently using {API_URL}.
          </p>
        )}
      </div>
    </div>
  );
}
