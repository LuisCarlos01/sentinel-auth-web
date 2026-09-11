export interface AccessTokenClaims {
  sub: string;
  roles: string[];
  exp: number;
}

/**
 * Decodificação só de leitura, sem verificar assinatura — usada apenas para
 * decisões de UI (mostrar/ocultar o link de admin). A autorização de verdade
 * continua sendo o backend (401/403); isto nunca substitui essa checagem.
 */
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json);
    return {
      sub: claims.sub,
      roles: Array.isArray(claims.roles) ? claims.roles : [],
      exp: claims.exp,
    };
  } catch {
    return null;
  }
}
