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
 * Sem corpo — o refresh token viaja só pelo cookie httpOnly (ADR-0002), o
 * backend lê o cookie antes do body mesmo que um fosse enviado
 * (`AuthController.resolveRefreshToken`, cookie vence).
 */
export function refresh() {
  return apiFetch<LoginResponse>('/api/v1/auth/refresh', { method: 'POST' });
}

export function logout(accessToken: string) {
  return apiFetch<void>('/api/v1/auth/logout', { method: 'POST', accessToken });
}

export function listUsers(accessToken: string) {
  return apiFetch<UserSummary[]>('/api/v1/users', { accessToken });
}
