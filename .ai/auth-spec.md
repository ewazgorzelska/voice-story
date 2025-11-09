# Authentication Architecture Specification

## Overview

- Implements user registration, login, logout, and password recovery to satisfy PRD stories US-001 through US-012 without regressing story generation, voice cloning, or library access flows.
- Built on the Astro 5 + React 19 island architecture with Tailwind 4 styling and shadcn/ui primitives for consistent UI.
- Integrates Supabase Auth for identity, using server-rendered Astro pages, React client forms, and API routes backed by the Node adapter defined in `astro.config.mjs`.

## 1. User Interface Architecture

### 1.1 Layout and Page Structure

- `src/layouts/AuthLayout.astro` (new): minimalist shell for unauthenticated routes (login, register, forgot/reset). Contains brand header, footer link to terms, and renders a centered content slot. Protects against accidental inclusion of authenticated navigation elements.
- `src/layouts/AppLayout.astro` (existing or new extension): wraps authenticated experience (story library, voice onboarding, generation). Injects `session`-aware navigation, story-specific breadcrumbs, and `LogoutButton` component. Accepts `session` via Astro props populated in page load functions.
- Astro pages:
  - `src/pages/login.astro`: uses `AuthLayout`, renders hero copy plus `<LoginForm />` React island.
  - `src/pages/register.astro`: mirrors login with `<RegisterForm />`, includes link to login.
  - `src/pages/auth/forgot-password.astro`: renders `<ForgotPasswordForm />` and copy describing reset flow.
  - `src/pages/auth/reset.astro`: entry point for Supabase recovery links; hydrates `<ResetPasswordForm />` only after validating query params (type=recovery, token).
  - `src/pages/logout.astro` (optional helper): server-only route that clears session then redirects; used by `LogoutButton` to avoid client JS race conditions.
  - Existing authenticated pages (`src/pages/index.astro`, `src/pages/library/index.astro`, story generation flows) updated to import `AppLayout` and expect `session` prop for conditional rendering without altering functional behaviour.
- Navigation updates:
  - `src/components/NavBar.tsx` (or equivalent) enhanced to display `Login`/`Register` CTAs when `session` absent and `LogoutButton` when present; ensure lazy client hydration aligns with Astro partial rendering.

### 1.2 React Form Components & Responsibilities

- Forms live in `src/components/auth/`, built as React 19 server-safe islands using shadcn/ui form primitives and Tailwind.
  - `LoginForm.tsx`: manages local state, client validation, posts to `/api/auth/login`, handles error states, stores loading indicator, triggers redirect via `window.location.assign` upon success.
  - `RegisterForm.tsx`: collects email, password, password confirmation, optional marketing consent flag (future-proof), posts to `/api/auth/register`, surfaces Supabase duplicate email errors.
  - `ForgotPasswordForm.tsx`: collects email, posts to `/api/auth/password-reset`, displays confirmation message instructing the user to check email.
  - `ResetPasswordForm.tsx`: renders only when provided a valid `access_token` from Supabase. Posts new password plus token to `/api/auth/password-update`, and on success, redirects the user to the login page to sign in with their new credentials.
  - `LogoutButton.tsx`: lightweight React component invoking `/api/auth/logout` via `fetch` and redirecting to `/login`.
- Forms emit structured analytics events (hook stub in `src/lib/analytics.ts`) without blocking UX.
- Astro pages are responsible for SEO metadata, gating (redirect if session already present), and passing initial state (e.g., email prefill) as props to React islands via `client:load` or `client:idle` directives depending on interactivity requirements.

### 1.3 Validation & Error Messaging

- Client-side validation performed before API calls to reduce round-trips:
  - Email: required, RFC 5322 compliant format; message “Enter a valid email address.”
  - Password (register/reset): required, minimum 12 chars, must include 1 uppercase, 1 lowercase, 1 digit; message “Use at least 12 characters with upper, lower, and a number.”
  - Password confirmation: must match password; message “Passwords must match.”
  - Login password: required; message “Enter your password.”
- Server responses provide specific error codes/messages mapped to UI copy:
  - `INVALID_CREDENTIALS`: “Invalid email or password.”
  - `EMAIL_IN_USE`: “This email is already registered.”
  - `RESET_EMAIL_SENT`: success toast “Check your inbox for a password reset link.”
  - `EXPIRED_OR_INVALID_TOKEN`: “This reset link is no longer valid. Request a new one.”
- Global form error region displays fallback message “Something went wrong. Please try again or contact support.” for unexpected failures.

### 1.4 Scenario Handling & Navigation Flow

- Authenticated visitors hitting `/login` or `/register` redirect to `/library` via server-side guard in Astro `load` function.
- Registration success automatically logs the user in (Supabase session), then navigate to `/onboarding/voice` if voice sample missing else `/library` per existing flows.
- Login success redirects to the page requested before redirect (stored in query param or cookie `auth_redirect`).
- Invalid credentials remain on `/login` with inline error (US-009).
- Registration with existing email surfaces inline error and keeps user on form (US-010).
- Forgot password success shows confirmation state without leaving the page.
- Reset page handles three cases: valid token (show form), invalid/expired (show error and link to `/auth/forgot-password`), signed-in user (redirect to `/library`).
- Logout button available in authenticated navigation; upon completion redirect to `/login` (US-003, US-012).

## 2. Backend Logic

### 2.1 API Surface (Astro Server Endpoints)

- `POST /api/auth/register`: expects `{ email, password, passwordConfirm }`; creates Supabase user, returns 201 with session info.
- `POST /api/auth/login`: expects `{ email, password }`; calls `supabase.auth.signInWithPassword`, returns 200 and `Set-Cookie` with access/refresh tokens.
- `POST /api/auth/logout`: clears Supabase auth cookies via `supabase.auth.signOut({ scope: 'global' })` to invalidate all sessions, returns 204.
- `POST /api/auth/password-reset`: expects `{ email }`; triggers `supabase.auth.resetPasswordForEmail` with `redirectTo` pointing at `/auth/reset`.
- `POST /api/auth/password-update`: expects `{ token, password }`; uses `supabase.auth.exchangeCodeForSession(token)` to establish session, then `supabase.auth.updateUser({ password })`, returns 200 and renewed cookies.
- All endpoints implemented under `src/pages/api/auth/*.ts`, using Astro server runtime (Node adapter) and `src/db/supabaseServerClient.ts` factory with service-role key stored server-side.

### 2.2 Request/Response Contracts

- Standard JSON input/output with `Content-Type: application/json`.
- Success responses contain `{ success: true, data: <payload> }`; errors contain `{ success: false, error: { code, message, details? } }`.
- Login/Register include `data.redirectPath` so forms can navigate consistently with server decisions (e.g., voice onboarding).

### 2.3 Validation Layer

- Define `src/lib/validation/authSchemas.ts` using Zod schemas mirroring client-side rules. Shared between API endpoints and React components (via `@astrojs/check` build-time bundling) to ensure parity.
- Use a helper `validateInput(schema, payload)` returning typed data or throwing `InputValidationError` (custom error class in `src/lib/errors.ts`).
- Prevent trusting client-sent redirect paths by whitelisting allowed destinations.

### 2.4 Exception & Logging Strategy

- Wrap Supabase calls in `try/catch`. Map known Supabase error codes (`auth/wrong-password`, `auth/user-not-found`, `auth/email-already-exists`, `auth/weak-password`, `auth/invalid-email`) to domain-specific error codes consumed by UI.
- Unknown errors logged via `src/lib/logger.ts` with context (endpoint, requestId, supabaseError, userEmail hashed). Return HTTP 500 with generic message.
- Implement rate limiting hook (middleware or edge service) for login and password reset endpoints using `src/lib/rateLimit.ts` (token bucket with IP + email key) to protect against brute force.

### 2.5 Server-Side Rendering & Data Fetching

- Astro pages leverage `export const prerender = false` (implicit with server output) and server-side `load`/top-level `await` to fetch session via Supabase helper.
- Update `src/middleware/index.ts` to instantiate Supabase auth helpers (`createSupabaseMiddleware`) so every request populates `Astro.locals.session` and `Astro.locals.supabase`.
- Pages that require auth check `locals.session` and redirect unauthenticated users to `/login?redirect=<path>` (US-012), preserving current behavior for story, voice, and library routes.
- Ensure SSR respects `astro.config.mjs` Node adapter by avoiding edge-only features; rely on serverless-friendly async patterns.

## 3. Authentication System

### 3.1 Supabase Client Configuration

- `src/db/supabaseServerClient.ts`: factory using service role key for privileged operations (password reset email). Exposed helper `getSupabaseServerClient(event)` caches client per request.
- `src/db/supabaseBrowserClient.ts`: initializes Supabase JS client with public anon key for client-side checks (optional; primary flows remain server-driven to protect secrets).
- Utilize `@supabase/auth-helpers-astro` for cookie management; configure in middleware to sync session across SSR and client.

### 3.2 Session Lifecycle Management

- Upon login/register, API endpoint sets `Set-Cookie` headers (`sb-access-token`, `sb-refresh-token`) using helper `setSessionCookies(response, session)` with secure, httpOnly, sameSite=strict flags.
- Middleware reads cookies, refreshes session automatically if expired using Supabase refresh token.
- Logout endpoint clears cookies and revokes refresh token server-side.
- `AuthLayout` pages check `Astro.locals.session` to avoid re-authenticating users already signed in.

### 3.3 Flow-Specific Supabase Integration

- Registration: call `supabase.auth.signUp({ email, password, options: { emailRedirectTo: app base } })`; enable email confirmation if required later. On success, session granted -> follow-up: create user profile row in `profiles` table via `src/lib/services/profileService.ts` (no-op if table already populated).
- Login: `signInWithPassword`; handle 400 errors for wrong credentials. On success, respond with redirect path.
- Password reset request: `resetPasswordForEmail` with `redirectTo: ${origin}/auth/reset`; rely on Supabase-managed email templates with brand assets.
- Password update: `exchangeCodeForSession(token)` ensures authenticity, then `updateUser`. After update, redirect to `/login?reset=success` and display toast.
- Logout: `supabase.auth.signOut({ scope: 'global' })` to invalidate refresh token.

### 3.4 Route Protection & Authorization

- Middleware enforces allowlist of public routes (`/login`, `/register`, `/auth/forgot-password`, `/auth/reset`, static assets). All other routes require `session`.
- Existing story generation, voice recording, and library routes rely on middleware result; no per-page conditional logic changes besides accepting `session` as prop.
- API routes enforce auth where needed: auth endpoints are public (except logout requiring session), story-generation endpoints check `locals.session` before interacting with ElevenLabs/OpenRouter services (preserves current safeguards).

### 3.5 Security, Observability, and Testing

- Enforce TLS-only cookies in production; set cookie domain from environment variable.
- Store Supabase keys in environment-managed secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Ensure service role key never reaches client bundles.
- Implement audit logging for critical auth events (register, login failure, password reset request) to `src/lib/logger` with PII minimized (email hashed using SHA-256 salt).
