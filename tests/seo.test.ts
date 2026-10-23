import { describe, expect, it } from 'vitest'
import { canonicalUrl, normalizeSiteOrigin } from '../src/seo/config'
import { buildHeadMetadata } from '../src/seo/head'
import { noIndexRoute, publicRouteRegistry } from '../src/seo/routes'
import { buildRobotsTxt, buildSitemapXml } from '../src/seo/sitemap'
import { serializeStructuredData } from '../src/seo/structuredData'

const testOrigin = 'https://seo-validation.example'

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys)
  if (typeof value !== 'object' || value === null) return []
  return Object.entries(value).flatMap(([key, entry]) => [key, ...collectKeys(entry)])
}

describe('public SEO registry', () => {
  it('defines unique route paths, titles, and descriptions for indexable pages', () => {
    const routes = publicRouteRegistry.filter((route) => route.indexable)
    expect(routes.length).toBeGreaterThan(0)
    expect(new Set(routes.map((route) => route.path)).size).toBe(routes.length)
    expect(new Set(routes.map((route) => route.title)).size).toBe(routes.length)
    expect(new Set(routes.map((route) => route.description)).size).toBe(routes.length)
    for (const route of routes) {
      expect(route.title.trim().length).toBeGreaterThan(0)
      expect(route.description.trim().length).toBeGreaterThan(0)
      expect(route.path.startsWith('/')).toBe(true)
    }
  })

  it('normalizes only production HTTPS origins and builds unique tracking-free canonicals', () => {
    expect(normalizeSiteOrigin(testOrigin)).toBe(testOrigin)
    expect(normalizeSiteOrigin('http://merchant.example')).toBeUndefined()
    expect(normalizeSiteOrigin('https://preview.workers.dev')).toBeUndefined()
    const canonicals = publicRouteRegistry.map((route) => canonicalUrl(route.path, testOrigin))
    expect(canonicals.every(Boolean)).toBe(true)
    expect(new Set(canonicals).size).toBe(canonicals.length)
    expect(canonicalUrl('/contact?campaign=tracking', testOrigin)).toBeUndefined()
    for (const path of ['/admin', '/api/admin', '/404', '/about/', '//evil.test', '/a/../about']) {
      expect(canonicalUrl(path, testOrigin)).toBeUndefined()
    }
    expect(normalizeSiteOrigin('https://user:password@merchant.example')).toBeUndefined()
  })

  it('aligns Open Graph URLs with canonical URLs and supports per-page social images', () => {
    for (const route of publicRouteRegistry) {
      const head = buildHeadMetadata(route, testOrigin)
      expect(head.canonical).toBe(canonicalUrl(route.path, testOrigin))
      expect(head.openGraphUrl).toBe(head.canonical)
    }
    const withImage = buildHeadMetadata({ ...publicRouteRegistry[0], openGraphImage: '/images/social-card.png', twitterImage: undefined }, testOrigin)
    expect(withImage.openGraphImage).toBe(`${testOrigin}/images/social-card.png`)
    expect(withImage.twitterImage).toBe(withImage.openGraphImage)
    const separateTwitterImage = buildHeadMetadata({ ...publicRouteRegistry[0], twitterImage: '/images/twitter-card.png' }, testOrigin)
    expect(separateTwitterImage.twitterImage).toBe(`${testOrigin}/images/twitter-card.png`)
  })

  it('serializes valid page-specific Schema.org data without unsupported business claims', () => {
    for (const route of publicRouteRegistry) {
      const head = buildHeadMetadata(route, testOrigin)
      const schemas = JSON.parse(serializeStructuredData(head.structuredData)) as Array<Record<string, unknown>>
      expect(schemas.length).toBeGreaterThan(0)
      expect(schemas.every((schema) => schema['@context'] === 'https://schema.org')).toBe(true)
      expect(schemas.some((schema) => schema['@type'] === 'Organization')).toBe(true)
      expect(schemas.some((schema) => schema['@type'] === 'WebSite')).toBe(true)
      expect(collectKeys(schemas)).not.toEqual(expect.arrayContaining(['aggregateRating', 'review', 'award', 'license', 'address', 'sameAs']))
    }
  })

  it('includes all and only indexable public canonicals in crawler artifacts', () => {
    const xml = buildSitemapXml([...publicRouteRegistry, noIndexRoute], testOrigin)
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
    expect(urls).toEqual(publicRouteRegistry.map((route) => canonicalUrl(route.path, testOrigin)))
    expect(xml).not.toContain('/admin')
    expect(xml).not.toContain('/404')
    expect(xml).not.toContain('lastmod')
    const privateRoutes = ['/admin', '/admin/users', '/api/health', '/404'].map((path) => ({ ...publicRouteRegistry[0], path }))
    expect(buildSitemapXml(privateRoutes, testOrigin)).not.toContain('<loc>')
    expect(xml).not.toMatch(/workers\.dev|pages\.dev|trycloudflare/i)
    expect(buildSitemapXml(publicRouteRegistry, undefined)).toContain('<urlset')
    expect(buildSitemapXml(publicRouteRegistry, undefined)).not.toContain('<loc>')
    const robots = buildRobotsTxt(testOrigin)
    expect(robots).toContain('Disallow: /admin')
    expect(robots).toContain('Disallow: /api/admin')
    expect(robots).toContain(`Sitemap: ${testOrigin}/sitemap.xml`)
    expect(buildRobotsTxt()).not.toContain('Sitemap:')
  })
})
