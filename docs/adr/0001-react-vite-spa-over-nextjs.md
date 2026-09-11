# React + Vite SPA instead of Next.js

The frontend has no SEO or server-rendering requirement — it's an authenticated app (register/login/admin listing) sitting behind a login wall. We chose React + Vite as a client-only SPA over Next.js to avoid mixing the in-memory-only access-token model with server components, which don't have access to client-side React state. A framework offering SSR by default (Next.js) would need explicit opt-outs on every authenticated route to avoid that mismatch; a plain SPA doesn't have the problem to begin with.
