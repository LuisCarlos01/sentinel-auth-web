import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { listUsers, type UserSummary } from '../auth/authApi';
import { ApiError } from '../auth/apiClient';

export function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listUsers(accessToken)
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load users'));
  }, [accessToken]);

  return (
    <div className="mx-auto flex min-h-[var(--app-height)] max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Link to="/" className="text-sm text-[var(--accent)] hover:underline">
          ← Back
        </Link>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {!error && !users && <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>}

      {users && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Created at</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--border)]">
                <td className="py-2">{u.email}</td>
                <td className="py-2">{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
