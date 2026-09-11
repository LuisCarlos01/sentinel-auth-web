# Sentinel Auth Web

Frontend SPA that consumes the `sentinel-auth-api` backend, exposing registration, login, an authenticated area, and an admin-only user listing. Ground truth for what the backend actually exposes lives in `docs/integrations/sentinel-auth-api-web.md`; this frontend never calls an endpoint that isn't cataloged there.

## Language

**Session**:
The client-side state that a user is authenticated, held for the lifetime of the browser tab. Backed by an in-memory access token; ends on logout, tab close, or access-token expiry without a valid refresh.
_Avoid_: Login state, auth state

**Access Token**:
The short-lived bearer credential sent as `Authorization: Bearer <token>` on every authenticated request. Held only in memory (React state); never written to `localStorage` or `sessionStorage`.
_Avoid_: JWT, auth token

**Refresh Token**:
The credential the backend uses to issue a new Access Token without re-authentication. Never touched directly by frontend code: it travels as an `httpOnly`, `Secure`, `SameSite=Strict` cookie set and read by the backend, sent automatically by the browser when a request uses credentials mode.
_Avoid_: Session token

**Admin**:
A User whose role grants access to the user listing screen (`GET /api/v1/users`). The only role distinction this frontend currently acts on.
_Avoid_: Superuser, root
