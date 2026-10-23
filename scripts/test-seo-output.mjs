import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer as createTcpServer } from 'node:net'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = process.cwd()
const dist = resolve(root, 'dist')
const wrangler = resolve(root, 'node_modules/wrangler/bin/wrangler.js')
const vite = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function unusedPort() {
  const server = createTcpServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Could not select a local port.')
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()))
  return address.port
}

const [{ publicRouteRegistry }, { buildHeadMetadata }, { siteOrigin }] = await Promise.all([
  vite.ssrLoadModule('/src/seo/routes.ts'),
  vite.ssrLoadModule('/src/seo/head.ts'),
  vite.ssrLoadModule('/src/seo/config.ts'),
])
await vite.close()

const canonicals = new Set()
for (const route of publicRouteRegistry.filter((item) => item.indexable)) {
  const file = route.path === '/' ? resolve(dist, 'index.html') : resolve(dist, `${route.path.slice(1)}.html`)
  const html = await readFile(file, 'utf8')
  const document = new JSDOM(html).window.document
  const expected = buildHeadMetadata(route, siteOrigin)

  assert(document.title === route.title, `${route.path}: prerendered title differs from route metadata.`)
  assert(document.querySelector('meta[name="description"]')?.content === route.description, `${route.path}: meta description mismatch.`)
  assert(document.querySelector('meta[name="robots"]')?.content === 'index, follow', `${route.path}: robots directive missing or wrong.`)
  assert(document.querySelector('meta[property="og:title"]')?.content === expected.openGraphTitle, `${route.path}: Open Graph title mismatch.`)
  assert(document.querySelector('meta[property="og:description"]')?.content === expected.openGraphDescription, `${route.path}: Open Graph description mismatch.`)
  assert(document.querySelector('meta[name="twitter:title"]')?.content === expected.twitterTitle, `${route.path}: Twitter title mismatch.`)
  assert(document.querySelector('meta[name="twitter:card"]')?.content === expected.twitterCard, `${route.path}: Twitter card mismatch.`)
  assert(document.querySelectorAll('#root h1').length === 1, `${route.path}: expected exactly one prerendered H1.`)
  assert(document.querySelector('#root')?.hasAttribute('data-prerendered'), `${route.path}: hydration marker is missing.`)

  const canonical = document.querySelector('link[rel="canonical"]')?.href
  if (siteOrigin) {
    assert(canonical === expected.canonical, `${route.path}: canonical mismatch.`)
    assert(new URL(canonical).protocol === 'https:', `${route.path}: canonical is not HTTPS.`)
    assert(document.querySelector('meta[property="og:url"]')?.content === canonical, `${route.path}: og:url does not match canonical.`)
    assert(!canonicals.has(canonical), `Duplicate canonical URL: ${canonical}`)
    canonicals.add(canonical)
  } else {
    assert(!canonical && !document.querySelector('meta[property="og:url"]'), `${route.path}: placeholder canonical leaked without a configured domain.`)
  }

  const jsonLd = document.querySelector('script[type="application/ld+json"]')
  assert(jsonLd, `${route.path}: JSON-LD is missing.`)
  const schemas = JSON.parse(jsonLd.textContent ?? '')
  assert(Array.isArray(schemas) && schemas.length > 0, `${route.path}: JSON-LD is not a non-empty schema array.`)
  for (const schema of schemas) {
    assert(schema['@context'] === 'https://schema.org' && typeof schema['@type'] === 'string', `${route.path}: invalid Schema.org object.`)
  }

  if (route.title.length < 30 || route.title.length > 65) console.warn(`Editorial warning: ${route.path} title is ${route.title.length} characters.`)
  if (route.description.length < 110 || route.description.length > 165) console.warn(`Editorial warning: ${route.path} description is ${route.description.length} characters.`)
}

const adminHtml = await readFile(resolve(dist, 'admin.html'), 'utf8')
const adminDocument = new JSDOM(adminHtml).window.document
assert(adminDocument.querySelector('meta[name="robots"]')?.content === 'noindex, nofollow', 'Admin shell must be noindex.')
assert(!adminDocument.querySelector('link[rel="canonical"]'), 'Admin shell must not have a canonical URL.')
assert(adminDocument.querySelector('#root')?.children.length === 0, 'Private admin content must not be prerendered.')

const sitemap = new JSDOM(await readFile(resolve(dist, 'sitemap.xml'), 'utf8'), { contentType: 'application/xml' }).window.document
const sitemapUrls = [...sitemap.querySelectorAll('urlset > url > loc')].map((element) => element.textContent)
assert(!sitemapUrls.some((url) => /\/admin(?:\/|$)|\/api\//.test(url ?? '')), 'Sitemap includes a private route.')
assert(!sitemapUrls.some((url) => /workers\.dev|pages\.dev|trycloudflare/i.test(url ?? '')), 'Sitemap includes a preview domain.')
if (siteOrigin) {
  assert(sitemapUrls.length === publicRouteRegistry.filter((route) => route.indexable).length, 'Sitemap omits an indexable public route.')
  assert(new Set(sitemapUrls).size === sitemapUrls.length, 'Sitemap contains duplicate URLs.')
} else {
  assert(sitemapUrls.length === 0, 'Sitemap should be empty until the production site URL is configured.')
}

const robots = await readFile(resolve(dist, 'robots.txt'), 'utf8')
assert(robots.includes('Disallow: /admin') && robots.includes('Disallow: /api/admin'), 'robots.txt must exclude private discovery paths.')
assert(siteOrigin ? robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`) : !robots.includes('Sitemap:'), 'robots.txt sitemap declaration does not match site URL configuration.')

const port = await unusedPort()
const worker = spawn(process.execPath, [wrangler, 'dev', '--env', 'development', '--port', String(port)], { cwd: root, stdio: 'ignore' })
try {
  const baseUrl = `http://127.0.0.1:${port}`
  let ready = false
  for (let attempt = 0; attempt < 60 && !ready; attempt += 1) {
    if (worker.exitCode !== null) throw new Error(`Wrangler exited before SEO smoke checks (${worker.exitCode}).`)
    try {
      ready = (await fetch(`${baseUrl}/api/health`)).ok
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 250))
    }
  }
  assert(ready, 'Wrangler did not start for direct-route checks.')

  for (const route of publicRouteRegistry.filter((item) => item.indexable)) {
    const response = await fetch(`${baseUrl}${route.path}`, { redirect: 'manual' })
    const html = await response.text()
    assert(response.status === 200, `${route.path}: direct Worker navigation returned ${response.status} (${response.headers.get('location') ?? 'no Location'}).`)
    assert(html.includes(`<title>${route.title.replaceAll('&', '&amp;')}</title>`), `${route.path}: Worker did not serve route-specific prerendered HTML.`)
    if (route.path !== '/') {
      const slashAlias = await fetch(`${baseUrl}${route.path}/`, { redirect: 'manual' })
      assert(slashAlias.status === 308 && slashAlias.headers.get('location') === `${baseUrl}${route.path}`, `${route.path}: trailing slash did not redirect to canonical path.`)
    }
  }

  const adminResponse = await fetch(`${baseUrl}/admin`)
  assert(adminResponse.status === 200, 'Local development admin shell should remain reachable.')
  assert(adminResponse.headers.get('x-robots-tag') === 'noindex, nofollow', 'Admin response must include X-Robots-Tag noindex.')
  const unauthenticated = await fetch(`${baseUrl}/api/admin/me`)
  assert(unauthenticated.status === 401, 'Private admin API must reject unauthenticated requests.')
  const health = await fetch(`${baseUrl}/api/health`)
  assert(health.status === 200, 'Public health API route must remain unaffected.')
  const missing = await fetch(`${baseUrl}/missing-page`, { headers: { 'Sec-Fetch-Mode': 'navigate' } })
  assert(missing.status === 404, 'Unknown navigation must return HTTP 404.')
  const missingDocument = new JSDOM(await missing.text()).window.document
  assert(missingDocument.querySelector('meta[name="robots"]')?.content === 'noindex, nofollow', '404 HTML must be noindex.')
  assert(missingDocument.title === 'Page Not Found | GoHero Payments', '404 must not serve homepage metadata.')
  const alias = await fetch(`${baseUrl}/about.html`, { redirect: 'manual' })
  assert(alias.status === 308 && alias.headers.get('location') === `${baseUrl}/about`, 'HTML aliases must redirect to the public route.')
} finally {
  worker.kill('SIGTERM')
  await once(worker, 'exit').catch(() => undefined)
}

console.log(`SEO output checks passed for ${publicRouteRegistry.filter((route) => route.indexable).length} prerendered routes; admin remains noindex and unprerendered.`)
