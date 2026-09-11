import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError } from './apiClient';
import * as authApi from './authApi';
import { decodeAccessToken } from './jwt';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthUser {
  id: string;
  roles: string[];
  /**
   * O JWT só carrega `sub`+`roles` (ver JwtService no sentinel-auth-api) —
   * sem endpoint de perfil, o email só existe no cliente quando acabou de
   * ser digitado no login desta sessão; some num reload (sessão restaurada
   * só pelo refresh, sem esse dado).
   */
  email: string | null;
}

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(accessToken: string, email: string | null): AuthUser | null {
  const claims = decodeAccessToken(accessToken);
  return claims ? { id: claims.sub, roles: claims.roles, email } : null;
}

/**
 * Access token E refresh token só vivem em memória (ADR-0002) — nunca
 * `localStorage`/`sessionStorage`. O cookie httpOnly do refresh token é
 * `SameSite=Strict`, que o browser não anexa em request cross-site (front
 * na Vercel, API noutro domínio) — por isso o valor do corpo da resposta é
 * o canal que de fato importa em produção; o cookie só ajuda no caso
 * same-site (dev local via proxy). Todo reload perde os dois tokens: sem
 * nada persistido, só dá pra reconstruir a sessão via cookie quando
 * same-site — esse bootstrap roda uma vez ao montar.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  const applySession = useCallback((token: string, refreshToken: string, email: string | null = null) => {
    refreshTokenRef.current = refreshToken;
    setAccessToken(token);
    setUser(toUser(token, email));
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    refreshTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // guard contra o double-invoke de efeitos do StrictMode em dev: sem isso,
  // duas chamadas de refresh saem quase juntas e a segunda already chega com
  // o refresh token que a primeira já rotacionou (ADR-0008) — toma 401 e
  // sobrescreve uma sessão que na verdade tinha sido restaurada com sucesso
  const hasBootstrapped = useRef(false);
  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;
    authApi
      .refresh()
      .then((res) => applySession(res.accessToken, res.refreshToken))
      .catch(() => clearSession());
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      applySession(res.accessToken, res.refreshToken, email);
    },
    [applySession],
  );

  const register = useCallback(async (email: string, password: string) => {
    await authApi.register({ email, password });
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessToken) await authApi.logout(accessToken, refreshTokenRef.current ?? undefined);
    } catch (err) {
      // 401 aqui só significa que a sessão já tinha expirado — segue o
      // logout local de qualquer forma, não há o que fazer no servidor
      if (!(err instanceof ApiError)) throw err;
    } finally {
      clearSession();
    }
  }, [accessToken, clearSession]);

  return (
    <AuthContext.Provider value={{ status, user, accessToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
