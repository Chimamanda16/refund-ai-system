import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="px-6 py-32 text-center">
      <h1 className="type-feature">Page not found</h1>
      <p className="mt-4 text-slate">The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="link-apple mt-6 inline-block">Back to customer refunds</Link>
    </section>
  );
}
