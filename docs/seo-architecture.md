# SEO Architecture

## Route registry

`src/seo/routes.ts` is the source of truth for public routes and their page-specific title, description, indexability, Schema.org types, optional breadcrumbs, and optional social-image overrides. `src/App.tsx` owns client route wiring; every new public registry entry must also have a corresponding React route and page component. Admin routes are intentionally absent from the public registry.

To add a page:

1. Add its public path and unique metadata to `publicRouteRegistry`.
2. Add a page component with one H1, semantic content, and the matching `pageMetadata` entry to `PageIntro`.
3. Add the route to `AppRoutes` and use a lazy import for route-level splitting.
4. Choose only supported structured-data types and verified properties. Do not add unverified addresses, credentials, awards, ratings, reviews, partnerships, or social profiles.
5. Add route-specific SEO assertions to `tests/seo.test.ts` if it needs special behavior.

Do not register future example pages until their content exists and has been approved. Location pages require distinct, useful local content; do not create duplicate or doorway pages.

## Canonical URL

Set `VITE_SITE_URL` to the confirmed HTTPS production origin (for example `https://www.example.com`) in the production build environment. It must be an origin without a path, query, or fragment. Preview domains and local hosts are rejected. Canonicals are constructed only from registered path strings, so request tracking parameters cannot enter canonical URLs. No production domain is currently configured; the build therefore omits canonical and `og:url` values rather than inventing a hostname.

`VITE_SITE_URL` is public build configuration, not a secret. Never put credentials in `VITE_*` variables.

## Head metadata and hydration

`src/seo/head.ts` derives the complete head model. `src/seo/SeoHead.tsx` applies it after client-side navigation. `scripts/prerender.mjs` uses Vite's SSR module loader and React's streaming renderer to render the existing lazy `AppRoutes` tree for each public registry route. It injects matching title, description, robots, canonical, Open Graph, Twitter/X, and JSON-LD values into route-specific `dist` HTML files. `src/main.tsx` calls `hydrateRoot` only when the generated root carries the prerender marker; otherwise it uses `createRoot` for Vite development.

To verify the actual generated files and direct Worker responses, run:

```sh
npm run test:seo
```

This runs a production build, checks route-specific HTML and JSON-LD, parses sitemap/robots output, confirms the admin shell is empty and noindex, and sends direct requests through Wrangler. `npm test` additionally verifies a streamed public render hydrates in jsdom and client navigation updates the title.

## Structured data

`src/seo/structuredData.ts` builds page-scoped `Organization`, `WebSite`, `WebPage`, `Service`, and optional `BreadcrumbList` JSON-LD. Organization data is limited to the verified GoHero Payments name. URLs are included only when the production origin is configured. Social images are optional route overrides; no default image is configured because no verified social-sharing image has been provided. When one is approved, add it under `public/images/` and set the route's `openGraphImage` to that local asset path.

## Sitemap and robots

After Vite creates `dist`, `scripts/prerender.mjs` writes `dist/sitemap.xml` and `dist/robots.txt` from the public route registry. The sitemap includes only indexable public routes with valid canonical URLs and intentionally has no `lastmod`. With no confirmed site origin it is a valid empty sitemap; robots omits the Sitemap line. Robots disallows discovery of `/admin` and `/api/admin`, but is not access control. The Worker separately protects `/admin`, `/admin/*`, and private APIs; admin HTML carries both a `noindex, nofollow` meta directive and `X-Robots-Tag`.

Sitemap output belongs in `dist`, not `public`; the old ignore rule for `public/sitemap.xml` was removed. Build output remains ignored by Git.

## Redirects

Canonicalization handles the configured preferred HTTPS hostname and the exact registered path only. For future path moves, create an explicit Cloudflare redirect rule from the old public route to its replacement, update the registry and internal links, and keep the old path out of the sitemap. Do not redirect admin/API paths around their Access policy or rewrite them to public content.

## Content and editorial review

The current page components intentionally retain approved-placeholder copy. Each public page has one H1 and route-specific metadata, but the body copy is not yet substantial enough for a completed marketing SEO launch. About, Contact, Privacy Policy, and Terms of Service are particularly sparse. Have business/legal owners approve the actual service details, policies, and disclosures before expanding page copy or publishing claims. `npm run test:seo` logs title/description length warnings for editorial review; those lengths are not arbitrary hard failures.

## Cloudflare routing and unknown URLs

The Worker runs first for all requests (`run_worker_first: true`), so future registry entries need no parallel Wrangler path list. This adds a Worker invocation to static asset requests. HTML handling and asset fallback are both `none`; the Worker requests exact `.html` asset paths. Public trailing slash and `.html` aliases redirect to the registered URL, preserving query parameters. Unknown URLs receive a rendered noindex 404 document with HTTP 404, never the homepage fallback. `/admin.html` is protected by the same authorization as `/admin`.

All public pages, including any future noindex public content, are prerendered. Admin receives only an empty noindex shell. Build validation rejects duplicate, private, and non-normalized registry paths. Sitemap generation independently excludes private, API, 404, and noindex entries.

`src/seo/dom.ts` is the shared metadata writer for both build-time rendering and client navigation. `npm test` checks hydration for every current public page and an unknown path, along with client navigation metadata. `npm run test:seo` checks actual production artifacts and local Worker responses. Test both an unset `VITE_SITE_URL` and a controlled test origin; never deploy test-domain artifacts.

Production Access and D1 bindings are still environment configuration prerequisites. Local Worker checks validate routing and fail-closed authorization; they cannot verify an undeployed Cloudflare Access policy.
