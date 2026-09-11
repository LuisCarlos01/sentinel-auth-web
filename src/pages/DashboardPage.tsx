import { Link } from 'react-router-dom';
import logoLogin from '../assets/logo-login.png';
import { useAuth } from '../auth/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  return (
    <div className="flex min-h-[var(--app-height)] w-full flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
      <img src={logoLogin} alt="Sentinel" className="h-14 w-14 object-contain" />
      <span
        className="mt-2 text-sm font-bold tracking-[0.35em] text-[var(--accent)]"
        style={{ fontFamily: 'var(--font-wordmark)' }}
      >
        SENTINEL
      </span>

      <h1 className="mt-8 text-2xl font-semibold">
        {user?.email ? `Welcome, ${user.email}!` : 'Welcome back!'}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">Your account is safe and sound.</p>

      {isAdmin && (
        <Link to="/admin/users" className="mt-6 text-sm font-medium text-[var(--accent)] hover:underline">
          View user list →
        </Link>
      )}

      <button
        type="button"
        onClick={() => logout()}
        className="mt-8 rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] hover:opacity-90"
      >
        Sign out
      </button>
    </div>
  );
}
