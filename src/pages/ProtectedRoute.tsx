import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * `status === 'loading'` cobre a tentativa de refresh silencioso feita no
 * mount (ver `AuthContext`) — sem essa espera, um reload redirecionaria pro
 * /login antes do refresh ter chance de restaurar a sessão a partir do
 * cookie.
 */
export function ProtectedRoute({ role, children }: { role?: string; children: ReactNode }) {
  const { status, user } = useAuth();

  if (status === 'loading') return null;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (role && !user?.roles.includes(role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
