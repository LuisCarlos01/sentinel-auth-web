# sentinel-auth-api — endpoint catalog for sentinel-auth-web

Generated 2026-09-10 by direct source inspection of `sentinel-auth-api`
(repo path: `/Users/luisdev/Dev/projetos/sentinel-auth-api`), at commit
`07413ab` (`07413abd61fc0f7981514a153ff2a20c03ebdd57`, `main`, HEAD at
inspection time). Re-verify this file whenever that backend changes —
nothing here should be treated as durable beyond that commit.

Naming: `docs/integrations/` did not exist yet in this repo, so it was
created following the `<tech>-<host>.md` convention documented in
`sentinel-auth-web/CLAUDE.md` (technical reference docs section):
`sentinel-auth-api` (the tech/service) + `web` (the host, i.e. this
frontend project).

## Summary

- **Base URL**: `http://<host>:8080` — no `server.port` override found in
  `application.yml`/`application-dev.yml`/`application-test.yml`, so Spring
  Boot's default `8080` applies. No `server.servlet.context-path` is set
  anywhere in `src/main/resources`, so paths below are the full paths (no
  extra prefix). Confirmed in prod deploy notes: container maps `8080:8080`
  (`docs/deployment.md:84`).
- **API versioning**: all business endpoints are under `/api/v1/...`
  (ADR-0002, `docs/adr/0002-uri-based-api-versioning.md`), matching
  `@RequestMapping("/api/v1/auth")` in
  `src/main/java/dev/sentinel/auth/auth/AuthController.java:16` and
  `@RequestMapping("/api/v1/users")` in
  `src/main/java/dev/sentinel/auth/user/UserController.java:9`.
- **Auth scheme**: JWT access token via `Authorization: Bearer <token>`
  header, checked in
  `src/main/java/dev/sentinel/auth/auth/JwtAuthenticationFilter.java:41-42`
  (header name `Authorization`, prefix literal `"Bearer "` at line 29). A
  missing/malformed/expired token does not itself 401 — the filter just
  skips setting authentication and the chain continues unauthenticated
  (lines 42-50); a route only 401s if it requires authentication.
  Additionally, `POST /api/v1/auth/login` and `POST /api/v1/auth/refresh`
  set/read an httpOnly refresh-token cookie named `refreshToken`, path
  `/api/v1/auth`, `Secure`, `SameSite=Strict`
  (`src/main/java/dev/sentinel/auth/auth/RefreshTokenCookie.java:15-27`).
- **CORS**: **no CORS configuration found** anywhere in `src/main` — no
  `CorsConfigurationSource` bean, no `@CrossOrigin`, no `WebMvcConfigurer`
  overriding `addCorsMappings`, no `cors` key in any `application*.yml`.
  Confirmed via `grep -rin "cors" src/main` (no matches). This is a **gap**:
  if the frontend is served from a different origin than `:8080`, cross-origin
  requests will currently fail unless CORS is added or a proxy is used
  frontend-side. Flag this to the backend team before wiring live requests
  from a browser origin different than the API's.
- **Spring Boot version**: `4.1.0` (`pom.xml:10`, `spring-boot-starter-parent`).
  Relevant starters: `spring-boot-starter-web`, `spring-boot-starter-security`,
  `spring-boot-starter-validation` (`pom.xml:32,36,40`) — Bean Validation
  (`@Valid`) on `register`/`login` bodies triggers `MethodArgumentNotValidException`
  → `400` via the global handler (see Errors below). Also present:
  `spring-boot-starter-data-jpa`, `flyway-core`, `jjwt-*` (JWT signing/parsing),
  `bucket4j` + `caffeine` (in-memory login rate limiting), `springdoc-openapi`
  (Swagger UI/OpenAPI, publicly exposed — see Auth section per-endpoint).

---

## POST /api/v1/auth/register

**Request**
- Body (`RegisterRequest`, `src/main/java/dev/sentinel/auth/auth/RegisterRequest.java:14-16`):
  - `email: String` — required (`@NotBlank`), must be a valid email (`@Email`), max length 254 (`@Size(max = 254)`).
  - `password: String` — required (`@NotBlank`), min length 8 (`@Size(min = 8)`).
- No path or query params.

**Response** — `201 Created` (`AuthController.java:26-29`, explicit `HttpStatus.CREATED`), body `RegisterResponse` (`src/main/java/dev/sentinel/auth/auth/RegisterResponse.java:10`):
- `id: UUID`
- `email: String`
- `createdAt: Instant`
- Never includes password/hash or any token — registration does not authenticate (doc comment, `RegisterResponse.java:8`).

**Errors**
- `400 Bad Request` — Bean Validation failure (missing/invalid `email` or `password`), RFC 9457 shape with an `errors` array of `{field, message}` — see `GlobalExceptionHandler.handleValidationErrors`, `src/main/java/dev/sentinel/auth/common/web/GlobalExceptionHandler.java:45-63`.
- `409 Conflict` — email already registered (case-insensitive), `EmailAlreadyRegisteredException` → `GlobalExceptionHandler.handleEmailAlreadyRegistered`, `GlobalExceptionHandler.java:24-29`; exception thrown in `AuthService.register`, `src/main/java/dev/sentinel/auth/auth/AuthService.java:69-71,85-89` (also as a race-condition fallback on `DataIntegrityViolationException`). Title `"Email already registered"`, generic message, does not echo the submitted email (`EmailAlreadyRegisteredException.java:7-11`).

**Auth**: public (`permitAll`). `SecurityConfig.java:51-52` lists `/api/v1/auth/register` explicitly.

**Source**: mapping `AuthController.java:25-29`; DTOs `RegisterRequest.java`, `RegisterResponse.java`; security rule `src/main/java/dev/sentinel/auth/config/SecurityConfig.java:51-52`; error mapping `GlobalExceptionHandler.java:24-29,45-63`, `EmailAlreadyRegisteredException.java`.

---

## POST /api/v1/auth/login

**Request**
- Body (`LoginRequest`, `src/main/java/dev/sentinel/auth/auth/LoginRequest.java:20`):
  - `email: String` — required (`@NotBlank`), must be a valid email (`@Email`).
  - `password: String` — required (`@NotBlank`), min length 8 (`@Size(min = 8)`).
- No path or query params.

**Response** — `200 OK` (`AuthController.java:64-70`, `ResponseEntity.ok()`), body `LoginResponse` (`src/main/java/dev/sentinel/auth/auth/LoginResponse.java:12`):
- `accessToken: String` — signed JWT (HS256), stateless, short-lived.
- `refreshToken: String` — opaque plaintext value, only ever present in this response; the server persists only its SHA-256 hash (ADR-0008).
- `tokenType: String` — always `"Bearer"`.
- `expiresIn: long` — access token TTL in seconds.
- Also sets a `Set-Cookie` header for the httpOnly refresh-token cookie (`AuthController.java:64-70`, `RefreshTokenCookie.set(...)`), name `refreshToken`, path `/api/v1/auth`, `Secure`, `SameSite=Strict`, `Max-Age` = refresh token TTL (`sentinel.jwt.refresh-token-ttl-days`, default 7 in `application.yml:21`).

**Errors**
- `400 Bad Request` — Bean Validation failure, same shape as register (see above). Note per DTO Javadoc (`LoginRequest.java:13-18`): the `@Size(min=8)` password check runs before any DB lookup, so a too-short password never distinguishes an existing vs. non-existing account (that distinction is intentionally erased by `401` below).
- `401 Unauthorized` — `InvalidCredentialsException` (generic for: unknown email, wrong password, locked account, or `enabled=false`) → `GlobalExceptionHandler.handleInvalidCredentials`, `GlobalExceptionHandler.java:31-36`; thrown in `AuthService.login`, `AuthService.java:97-105`. Title `"Invalid credentials"`.
- `429 Too Many Requests` — login rate limiting (ADR-0010), two independent Caffeine/Bucket4j buckets (by client IP and by request-body email, 5 attempts/minute each by default — `application.yml:33-34`), enforced in `src/main/java/dev/sentinel/auth/auth/LoginRateLimitFilter.java` (limits at lines 33, `writeTooManyRequests` at 116-124). This runs as a servlet filter *before* the DispatcherServlet, so it is **not** produced by `GlobalExceptionHandler` — it writes its own RFC 9457 `ProblemDetail` directly (title `"Too Many Requests"`, detail `"Too many login attempts"`, no distinction on which bucket tripped).

**Auth**: public (`permitAll`), but gated by `LoginRateLimitFilter` before credential checks (`SecurityConfig.java:65`, filter registered `addFilterBefore(loginRateLimitFilter, JwtAuthenticationFilter.class)`).

**Source**: mapping `AuthController.java:31-35,64-71`; DTOs `LoginRequest.java`, `LoginResponse.java`; cookie `RefreshTokenCookie.java:20-28`; security rule `SecurityConfig.java:51-52`; rate limit `LoginRateLimitFilter.java` (whole file), config keys `application.yml:26-34`; error mapping `GlobalExceptionHandler.java:31-36`, `InvalidCredentialsException.java`.

---

## POST /api/v1/auth/refresh

**Request**
- Body (`RefreshRequest`, optional — `@RequestBody(required = false)`, `AuthController.java:38-39`): `refreshToken: String` — **no Bean Validation annotations** (deliberate, ADR-0009: an absent/blank value is treated as an invalid refresh token, i.e. `401`, not a `400` validation error — see `RefreshRequest.java:4-8`).
- The refresh token can instead (or additionally) arrive via the `refreshToken` cookie; **cookie wins over body when both are present** (`AuthController.java:58-62`, `resolveRefreshToken`).
- No path or query params.

**Response** — `200 OK`, same `LoginResponse` shape and same `Set-Cookie` behavior as login (`AuthController.java:37-43,64-71`) — refresh rotates the refresh token (old one deleted, new one issued and persisted; ADR-0008, `AuthService.java:110-120`).

**Errors**
- `401 Unauthorized` — `InvalidRefreshTokenException`, generic for: token missing/blank, not found, expired, or already used (rotation already consumed) — `AuthService.java:112-119,135-143`, `GlobalExceptionHandler.handleInvalidRefreshToken`, `GlobalExceptionHandler.java:38-43`. Title `"Invalid refresh token"`.
- No documented `400` path since the request DTO has no validation constraints.

**Auth**: public (`permitAll`) — `SecurityConfig.java:51-52` lists `/api/v1/auth/refresh` explicitly. Note this route is *not* covered by `LoginRateLimitFilter` (that filter only matches `POST /api/v1/auth/login`, `LoginRateLimitFilter.java:46-47`).

**Source**: mapping `AuthController.java:37-43`; DTO `RefreshRequest.java`; cookie read `RefreshTokenCookie.java:42-52`; service `AuthService.java:110-120,135-143`; security rule `SecurityConfig.java:51-52`; error mapping `GlobalExceptionHandler.java:38-43`, `InvalidRefreshTokenException.java`.

---

## POST /api/v1/auth/logout

**Request**
- Body (`LogoutRequest`, optional — `@RequestBody(required = false)`, `AuthController.java:46-48`): `refreshToken: String` — no Bean Validation, same deliberate treatment as `refresh` (`LogoutRequest.java:4-7`).
- Refresh token resolution is identical to `refresh`: cookie takes precedence over body (`AuthController.java:58-62`).
- Requires an authenticated caller: `Authentication authentication` param, and the controller reads `authentication.getName()` as the user's UUID (`AuthController.java:49,51`) — i.e. this endpoint needs a valid `Authorization: Bearer` access token, not just a refresh token.
- No path or query params.

**Response** — `204 No Content` (`AuthController.java:53-56`, `ResponseEntity.noContent()`), empty body. Also sets `Set-Cookie` clearing the refresh-token cookie (`Max-Age=0`, `RefreshTokenCookie.clear()`, `RefreshTokenCookie.java:31-38`).

**Errors**
- `401 Unauthorized` (two distinct causes, same status/shape family):
  - No/invalid access token → handled by Spring Security's `RestAuthenticationEntryPoint` (not `GlobalExceptionHandler` — runs before the `DispatcherServlet`), `src/main/java/dev/sentinel/auth/auth/RestAuthenticationEntryPoint.java:31-37`. RFC 9457 body, title `"Unauthorized"`, detail `"Authentication required"`.
  - Refresh token missing/not found/not owned by the authenticated user → `InvalidRefreshTokenException` via `AuthService.logout`, `AuthService.java:122-130` (note: does not confirm/deny existence of a token belonging to a *different* user — same generic exception, `AuthService.java:124-126`), mapped by `GlobalExceptionHandler.java:38-43`.
- No `400` validation path (no Bean Validation on `LogoutRequest`).

**Auth**: authenticated (falls under `anyRequest().authenticated()`, `SecurityConfig.java:59-60` — not explicitly listed as public or role-restricted).

**Source**: mapping `AuthController.java:45-56`; DTO `LogoutRequest.java`; cookie clear `RefreshTokenCookie.java:31-38`; service `AuthService.java:122-130`; security rule `SecurityConfig.java:59-60`; entry point `RestAuthenticationEntryPoint.java`; error mapping `GlobalExceptionHandler.java:38-43`, `InvalidRefreshTokenException.java`.

---

## GET /api/v1/users

**Request**: no path params, no query params, no body.

**Response** — `200 OK` (implicit — controller returns `List<UserSummaryResponse>` directly, no `@ResponseStatus`/`ResponseEntity`, default Spring MVC success status for a normal return is `200`; `UserController.java:18-21`). Body: JSON array of `UserSummaryResponse` (`src/main/java/dev/sentinel/auth/user/UserSummaryResponse.java:11`):
- `id: UUID`
- `email: String`
- `createdAt: Instant`

**Errors**
- `401 Unauthorized` — no/invalid access token, via `RestAuthenticationEntryPoint` (same shape as documented under `logout`), `RestAuthenticationEntryPoint.java:31-37`.
- `403 Forbidden` — authenticated but missing the `ADMIN` role, via `RestAccessDeniedHandler.java:32-38` (RFC 9457, title `"Forbidden"`, detail `"Missing required role"`). Also runs outside `GlobalExceptionHandler` (pre-`DispatcherServlet` filter chain).

**Auth**: authenticated **and** role `ADMIN` — `.requestMatchers("/api/v1/users").hasRole("ADMIN")` (`SecurityConfig.java:57-58`). Enforced by URL-pattern matcher, not method security (`@PreAuthorize`) — per the class Javadoc this is the only role-restricted route in the project so far (`SecurityConfig.java:24-26`). Role comes from the JWT's `roles` claim, mapped to Spring authorities prefixed `ROLE_` (`JwtAuthenticationFilter.java:56-59`, `JwtService.java:24,47`).

**Source**: mapping `UserController.java:18-21`; DTO `UserSummaryResponse.java`; security rule `SecurityConfig.java:57-58`; role/authority mapping `JwtAuthenticationFilter.java:54-60`, `JwtService.java:43-52`; access-denied handler `RestAccessDeniedHandler.java`.

---

## Non-business public paths (for completeness, not app endpoints)

Also `permitAll` in `SecurityConfig.java:53-56`:
- `/actuator/health`, `/actuator/info` — only these two Actuator endpoints are exposed (`management.endpoints.web.exposure.include: health,info`, `application.yml:36-40`).
- `/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**` — Swagger UI/OpenAPI (springdoc), made public per a documented incident (issue #22, comment at `SecurityConfig.java:19-22`): without this exception both Swagger and Actuator health fell under `anyRequest().authenticated()`.

---

## Gaps / Ambiguities

1. **CORS is entirely unconfigured** in `sentinel-auth-api` as of commit `07413ab` — no `CorsConfigurationSource` bean, no `@CrossOrigin`, no `WebMvcConfigurer`, no YAML `cors` keys found (`grep -rin "cors" src/main` returned nothing). If `sentinel-auth-web` calls this API from a browser at a different origin, requests will be blocked by the browser unless CORS is added backend-side or a same-origin proxy is used. Not something I can resolve by reading source — needs a decision from whoever owns the backend.
2. **`server.port` / context-path**: no explicit `server.port` or `server.servlet.context-path` in any of `application.yml`, `application-dev.yml`, `application-test.yml`. Assumed Spring Boot default port `8080` based on absence of override plus `docs/deployment.md:84` showing `8080:8080` container mapping — reasonably confirmed, but there is no single explicit `server.port: 8080` line to cite.
3. **`GET /api/v1/users` success status**: inferred as `200 OK` from Spring MVC's default behavior for a controller method that returns a value directly (no `@ResponseStatus`, no `ResponseEntity`). This is standard Spring behavior, not something asserted in an annotation in this codebase — flagging since the task asked to derive status from `@ResponseStatus`/`ResponseEntity` specifically and neither is present here.
4. **No pagination on `GET /api/v1/users`**: it returns the full list unconditionally (`UserService.listAll()` called with no params, `UserController.java:19-20`). Not verified against `UserService`/`UserRepository` implementation — only the controller was inspected for this endpoint; if the frontend needs paging behavior, check `src/main/java/dev/sentinel/auth/user/UserService.java` and `UserRepository.java` directly (not read for this catalog).
5. **`UserSummaryResponse` does not expose roles** — only `id`, `email`, `createdAt`. If the frontend needs to render a user's role(s) from this endpoint, that data is not currently in the response shape; confirm this is intentional before assuming role data is available here.
6. **Rate limit values are configurable via env vars** (`SENTINEL_RATE_LIMIT_LOGIN_CAPACITY`, `SENTINEL_RATE_LIMIT_LOGIN_WINDOW_SECONDS`, `application.yml:33-34`, defaults 5/60s) — actual runtime values in any given deployed environment were not verified (no `.env`/deployment env inspected here), so the `429` threshold documented above (5 attempts/min) is the *default*, not a guaranteed production value.
7. **JWT signing key** comes from `JWT_SIGNING_KEY` env var (`application.yml:19`) — not inspected/verified beyond that it's required and not hardcoded; no implication for frontend behavior beyond "access tokens are opaque bearer strings to the client."
