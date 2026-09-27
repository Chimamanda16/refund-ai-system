import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `type-label rounded-full px-3 py-1.5 font-medium transition-colors ${isActive ? 'bg-studio-mist text-ink' : 'text-slate hover:text-ink'}`;

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-[8px] text-white"
        style={{ background: 'linear-gradient(155deg, var(--color-pricing-blue), var(--color-pricing-blue-dark))' }}
        aria-hidden="true"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M4 7a8 8 0 1 1-1.5 4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M2 4v4.5h4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-sf-pro-display text-[15px] font-semibold tracking-tight text-ink">Refund Desk</span>
    </span>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline-silver bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6" aria-label="Main">
          <BrandMark />
          <div className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>Customer refunds</NavLink>
            <NavLink to="/admin" className={linkClass}>Admin</NavLink>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-hairline-silver bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="type-small text-steel">© {new Date().getFullYear()} Refund Desk. All requests are reviewed under our standard returns policy.</p>
          <div className="flex items-center gap-1.5 text-steel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3l7 3v5c0 4.6-3 8.7-7 10-4-1.3-7-5.4-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="type-label">Secure request handling</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
