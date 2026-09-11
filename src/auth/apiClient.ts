const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errors: FieldError[];

  constructor(status: number, message: string, errors: FieldError[] = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  accessToken?: string | null;
}

/**
 * `credentials: 'include'` é obrigatório em toda chamada — é assim que o
 * cookie httpOnly do refresh token (setado pelo backend) é enviado de volta
 * (ADR-0002). Sem isso o refresh nunca funciona, mesmo com o access token
 * certo no header.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get('content-type')?.includes('json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const detail = payload?.detail ?? payload?.title ?? 'Request failed';
    const errors: FieldError[] = Array.isArray(payload?.errors) ? payload.errors : [];
    throw new ApiError(response.status, detail, errors);
  }

  return payload as T;
}
