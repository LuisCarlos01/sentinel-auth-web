import { apiFetch } from './apiClient';

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserSummary {
  id: string;
  email: string;
  createdAt: string;
}

export function register(body: RegisterRequest) {
  return apiFetch<RegisterResponse>('/api/v1/auth/register', { method: 'POST', body });
}

export function login(body: LoginRequest) {
  return apiFetch<LoginResponse>('/api/v1/auth/login', { method: 'POST', body });
}

/**
 * O refresh token viaja explícito no corpo (não só no cookie httpOnly) —
 * necessário porque o cookie é `SameSite=Strict`, que o browser nunca anexa
 * em request cross-site (front na Vercel, API em outro domínio); o corpo é
 * o único canal que funciona nesse caso (ver ADR-0002, corrigido). Ainda
 * assim manda `credentials: 'include'` (via `apiFetch`) — inofensivo, e
 * cobre o caso same-site (dev local via proxy) de graça.
 */
export function refresh(refreshToken?: string) {
  return apiFetch<LoginResponse>('/api/v1/auth/refresh', {
    method: 'POST',
    body: refreshToken ? { refreshToken } : undefined,
  });
}

export function logout(accessToken: string, refreshToken?: string) {
  return apiFetch<void>('/api/v1/auth/logout', {
    method: 'POST',
    accessToken,
    body: refreshToken ? { refreshToken } : undefined,
  });
}

export function listUsers(accessToken: string) {
  return apiFetch<UserSummary[]>('/api/v1/users', { accessToken });
}
