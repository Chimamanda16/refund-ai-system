import { API_URL } from '../lib/apiClient.js';

export function LoadingNotice({ children = 'Loading…' }) {
  return <p className="text-slate" role="status">{children}</p>;
}

/** Says what went wrong and how to fix it. */
export function ErrorNotice({ error }) {
  const unreachable = error?.code === 'NETWORK_ERROR';
  return (
    <div className="card" role="alert">
      <p className="type-card-title">Something went wrong</p>
      <p className="mt-2 text-slate">{error?.message}</p>
      {unreachable && (
        <p className="type-small mt-2 text-slate">
          Start the backend (<code>docker compose up</code>) or check that VITE_API_URL points to it.
          Currently using {API_URL}.
        </p>
      )}
    </div>
  );
}
