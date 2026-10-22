# GoHero Payments

A React and TypeScript foundation for the GoHero Payments website. Merchant payment processing and business funding are represented as separate routes and service areas. All page copy is provisional; no company history, claims, rates, testimonials, affiliations, or legal terms are fabricated.

## Stack

React 19, TypeScript strict mode, Vite, Tailwind CSS 4, React Router 7, Lucide React, Zod, Oxlint, Vitest, and Cloudflare Workers with Static Assets.

## Local development

Requirements: Node.js 24 LTS (or a compatible current LTS) and npm. A Cloudflare account is not needed for the frontend.

```sh
npm install
npm run dev
```

The Vite server prints its local URL (normally `http://localhost:5173`). Copy `.env.example` to `.env.local` only when configuring a confirmed public site URL.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Generate an optional sitemap, typecheck, and build static assets |
| `npm run preview` | Preview the static Vite build |
| `npm run typecheck` | Check frontend and Worker TypeScript |
| `npm run lint` | Run Oxlint |
| `npm run test` | Run route and Worker tests |
| `npm run audit` | Audit installed npm dependencies |
| `npm run cf:dev` | Build and run locally in Wrangler's Workers runtime |
| `npm run cf:preview` | Build and run using Wrangler's remote preview mode |
| `npm run deploy` | Build and deploy to the configured Cloudflare account |

`npm run deploy` is provided for later use and has not been run.

## Structure

```text
public/                 Static public files and crawler rules
scripts/                Build-time sitemap generation
src/components/          Shared layout, navigation, UI, and SEO
src/config/              Navigation, site settings, route metadata
src/lib/                 Shared validation
src/pages/               Lazy-loaded route placeholders
src/styles/              Tailwind v4 theme and global styles
tests/                   App and Worker tests
worker/                  Cloudflare API and asset request handler
wrangler.jsonc           Worker and Static Assets configuration
```

## Cloudflare

Wrangler serves `dist/` through Static Assets and uses the SPA fallback for client routes. `/api/*` is sent to `worker/index.ts` first; `/api/health` returns service status and unknown API paths return JSON 404. Static asset responses receive baseline security headers. Cloudflare account authentication is needed only for remote preview or deployment. Run `npx wrangler login` and configure the target account/domain in Cloudflare before deployment; no resources are provisioned by this project.

Current security headers include nosniff, frame denial, referrer policy, and a restrictive permissions policy. CSP is intentionally not enabled yet: the final policy depends on approved analytics, form, and asset origins. Before production, define a restrictive `default-src 'self'` policy and narrowly allow only required origins; do not add unrestricted `unsafe-eval` or `unsafe-inline`. Website security settings do not establish PCI or financial regulatory compliance.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Confirmed canonical site origin, such as `https://your-approved-domain.example` |

Without `VITE_SITE_URL`, canonical URLs, `og:url`, organization structured data, and sitemap generation are omitted. Do not put secrets in `VITE_*` variables; Vite bundles them into public client code. Worker secrets should later be configured as Cloudflare secrets, not committed files.

Route SEO metadata updates during client-side navigation. This is a client-rendered SPA, so crawlers that do not execute JavaScript may not see route-specific metadata in the initial HTML. SSR or prerendering is intentionally out of scope for this phase.

## Forms and security

`src/lib/validation.ts` contains a Zod schema for basic business contact information only. There are no active submissions or external integrations. Do not add payment card details, bank account information, Social Security numbers, or other sensitive financial data to forms. Turnstile, rate limiting, CRM, and email integrations remain future work.

`.env`, local Wrangler state, build output, and generated sitemap files are ignored by Git. Review disclosures and legal page text with the appropriate business and legal stakeholders before publishing.

## Next phase

Confirm brand assets, public domain, approved service details and disclosures, then design the homepage and service pages. Follow with an approved contact workflow, privacy/terms review, accessibility review, and production CSP design. Measure Core Web Vitals only after the design is integrated and deployed to a test environment.

## Lead management portal

The admin application is lazy-loaded under `/admin`, with dashboard, leads, lead detail, pipeline, follow-ups, reports, users, audit history, and admin 404 routes. Its JavaScript is public client code; access control is not a way to make bundles confidential. All lead records stay behind Worker APIs, D1 queries, and role checks. No D1 binding or credential is exposed to browser code.

### Cloudflare Access coverage

Create **two self-hosted Access applications** on the production hostname; do not rely on one path rule to cover siblings:

1. Admin UI application: protect exact `/admin` and wildcard `/admin/*` (if the dashboard supports path entries separately, create entries for both). Apply an allow policy only to the organization’s approved administrator and sales groups, plus an explicit deny for everyone else.
2. Admin API application: protect `/api/admin` and `/api/admin/*` as a distinct application. Apply the same approved identity policy. Do not add a public bypass policy for API paths.

The Worker also requires and cryptographically verifies the Cloudflare Access JWT for every `/api/admin` request. Set `CF_ACCESS_TEAM_DOMAIN` to the team host (for example `team-name.cloudflareaccess.com`), `CF_ACCESS_AUD_ADMIN` to the Admin UI application's audience tag, and `CF_ACCESS_AUD_API` to the Admin API application's audience tag. If paths share a single app/audience, the API audience may contain that one aud value; when separate applications are configured, keep the audience values separate. Set these values in Wrangler's production `vars` or deployment environment, never in `VITE_*` variables. The Worker fetches the Access signing keys from `https://<team-domain>/cdn-cgi/access/certs` and checks RS256 signature, issuer, audience, expiry, subject, and email before mapping the subject to an active D1 user.

Access must be configured on the same hostname and proxy path that reaches this Worker. Wrangler sends `/admin`, `/admin/*`, and `/api/*` through the Worker before Static Assets; the API dispatcher runs before SPA handling. Verify the Access application coverage on the production hostname before deployment. The Worker rejects missing/invalid auth even if an Access application is misconfigured. Do not trust identity headers other than the verified Access JWT.

### D1 setup and controlled bootstrap

No remote database has been created or migrated. The configured production D1 ID is deliberately a placeholder. After authorization to provision resources:

```sh
npx wrangler d1 create gohero-payments-db
# Put the returned database_id in the production d1_databases binding in wrangler.jsonc.
npm run db:migrate:remote
```

Local development uses a different D1 binding and deterministic synthetic identities:

```sh
npm run db:migrate:local
npm run db:seed:local
npm run cf:dev
```

The local admin page offers fixed `admin` and `sales` identities only in the `cf:dev` bundle, built with `VITE_DEV_AUTH_ENABLED=true`, and when Wrangler sets both `APP_ENV=development` and `DEV_AUTH_ENABLED=true`. The Worker ignores this adapter outside that exact environment; the normal production build omits the identity selector and header. Local auth never accepts arbitrary identity values, and it does not skip D1 role checks. `npm run test:d1` builds, applies/seeds only local D1, starts Wrangler, and runs synthetic API checks. It never uses remote customer data.

For the first production administrator, do **not** grant admin on first login. First configure a restrictive Access group and require MFA according to company policy. Obtain the subject (`sub`) and verified email from a JWT whose signature, issuer, audience, and expiry have been independently verified. Have an authorized database operator insert one explicit administrator row through a reviewed, parameterized process, recording the Access subject exactly; then verify `/api/admin/me`. Example fields (replace all placeholders; do not run this sample literally):

```sql
INSERT INTO users (id, access_identity_id, email, display_name, role, active)
VALUES (?, ?, ?, ?, 'administrator', 1);
```

All subsequent identities start without access until explicitly provisioned. Role changes are admin-only, self-role/self-deactivation changes are rejected, and a D1 trigger prevents removal of the last active administrator. Audit rows are generated in the same D1 batch as mutations.

### API and privacy notes

Private routes include `GET /api/admin/me`, dashboard, paginated/filterable leads, lead detail, notes, follow-ups, reports, users, audit, and bounded CSV export. Mutations validate JSON with Zod, cap bodies at 16 KiB, require same-origin `Origin`, use parameterized D1 statements, and return `Cache-Control: no-store`. Public lead submission endpoints are not implemented or activated. No permanent deletion route exists.

Lead money values use integer cents; years-in-business is optional. Never add card numbers, bank credentials, SSNs, or sensitive documents. Before production data is entered, business/legal owners must approve privacy notice and consent, purpose and retention periods, deletion/subject request handling, access review cadence, incident response, and any jurisdiction-specific regulatory obligations. This project does not claim PCI, SOC 2, or financial regulatory compliance.

### Implemented versus account setup

Implemented and locally tested: D1 migration/schema and local seed, Access JWT verification, role scoping, lead lifecycle, notes/activity, follow-ups, reports, user role changes, audit logging, export, SPA/API Worker routing, and admin pages. Awaiting manual account setup: production D1 creation/ID, Access applications/policies/audience values, approved production user bootstrap, domain/HTTPS routing, and deployment approval. No remote migration, paid resource creation, Access configuration, or deployment was performed.
