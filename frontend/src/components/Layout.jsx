import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `type-label transition-colors ${isActive ? 'text-ink' : 'text-ink/80 hover:text-ink'}`;

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-control-gray bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-11 max-w-5xl items-center justify-between px-6" aria-label="Main">
          <span className="type-label font-semibold">Refund Desk</span>
          <div className="flex items-center gap-8">
            <NavLink to="/" end className={linkClass}>Customer refunds</NavLink>
            <NavLink to="/admin" className={linkClass}>Admin</NavLink>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

    </div>
  );
}
