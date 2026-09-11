# Access token in memory, refresh token via credentialed cookie

The backend (`sentinel-auth-api`) issues the refresh token as an `httpOnly`/`Secure`/`SameSite=Strict` cookie, not a response body field — this is fixed on the backend side and not something the frontend can change. To receive and replay that cookie, every request to the API must use credentials mode (`fetch` with `credentials: 'include'`).

The access token is kept in memory only (React Context), never in `localStorage`/`sessionStorage`, to limit exposure to XSS: a script that can read persisted storage could exfiltrate a long-lived credential, whereas an in-memory token dies with the tab and is unreachable from a fresh page load.

Consequence: the `Secure` cookie flag requires the backend to be served over HTTPS. This is why the backend's Caddy/HTTPS setup (`sentinel-auth-api` ADR-0013) was a hard prerequisite for this frontend to work against the deployed instance — over plain HTTP, the browser silently drops the cookie and refresh breaks.
