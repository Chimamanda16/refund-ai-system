import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="flex flex-col items-center px-6 py-32 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-studio-mist text-steel" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <h1 className="type-feature mt-6">Page not found</h1>
      <p className="mt-3 max-w-sm text-slate">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/" className="pill-blue mt-7">Back to customer refunds</Link>
    </section>
  );
}
