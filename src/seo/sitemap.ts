import { canonicalUrl, normalizeSiteOrigin } from './config'
import { publicRouteRegistry } from './routes'
import type { SeoRoute } from './types'
import { isPublicContentPath } from './paths'

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

export function buildSitemapXml(routes: SeoRoute[] = publicRouteRegistry, configuredOrigin?: string): string {
  const origin = normalizeSiteOrigin(configuredOrigin)
  const urls = origin
    ? [...new Set(routes.filter((route) => route.indexable && isPublicContentPath(route.path)).map((route) => canonicalUrl(route.path, origin)).filter((url): url is string => Boolean(url)))]
    : []
  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries ? `\n${entries}\n` : ''}</urlset>\n`
}

export function buildRobotsTxt(configuredOrigin?: string): string {
  const origin = normalizeSiteOrigin(configuredOrigin)
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/admin',
    ...(origin ? [`Sitemap: ${origin}/sitemap.xml`] : []),
    '',
  ].join('\n')
}
