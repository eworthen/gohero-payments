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
