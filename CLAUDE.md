## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues, using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.

### Technical reference

Third-party technical reference lives in `docs/technologies/<tech>.md` (the technology on
its own terms) and `docs/integrations/<tech>-<host>.md` (how it plugs into this stack).

Write a file only where the model's own knowledge is insufficient — an obscure library, a
recent version, an API that changed — **or** where there is a project decision to record
(which option we picked, and why). Do not write one for well-known basics; that is cost
with no return.

`/research` produces these files, against primary sources, citing the source for each
claim. Contextualise to this project: what we use, how we use it here, anti-patterns, and
any decision still pending.

Consult the relevant file before implementing or editing code that uses that technology —
do not ask "how does this library work" before reading it. Do not load the whole folder by
default; open only the files the change touches.

When a ticket touches one of these technologies, link the file from the ticket body, so
`/implement` finds it in a clean context.

### Security audit

`.claude/skills/security-audit/` — run with `/security-audit [path]` or "auditar segurança".
Sourced from [devfraga/skills-sujeito-programador](https://github.com/devfraga/skills-sujeito-programador/tree/main/security-audit),
copied verbatim. Written for Next.js/React projects (Server Actions, Prisma, Stripe, Auth.js)
— this repo is a plain Vite SPA with no backend of its own (real API is `sentinel-auth-api`,
audited separately), so most Next-specific checks (`refs/nextjs-checklist.md`,
`refs/proxy-middleware.md`) won't find anything to check here; the parts that still apply are
dependency audit (`npm audit`), tracked secrets, and general XSS/auth-flow review of `src/auth/`.
Never auto-patches — proposes fixes only.
