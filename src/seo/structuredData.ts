import { canonicalUrl, organizationName, siteOrigin } from './config'
import type { SeoRoute } from './types'

export function buildStructuredData(route: SeoRoute, origin = siteOrigin): Record<string, unknown>[] {
  const canonical = canonicalUrl(route.path, origin)
  const schemas: Record<string, unknown>[] = []
  const organizationId = origin ? `${origin}/#organization` : undefined
  const websiteId = origin ? `${origin}/#website` : undefined

  if (route.structuredData.includes('Organization')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      ...(organizationId ? { '@id': organizationId, url: origin } : {}),
      name: organizationName,
    })
  }

  if (route.structuredData.includes('WebSite')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      ...(websiteId ? { '@id': websiteId, url: origin } : {}),
      name: organizationName,
      publisher: organizationId ? { '@id': organizationId } : { '@type': 'Organization', name: organizationName },
    })
  }

  if (route.structuredData.includes('WebPage')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      ...(canonical ? { url: canonical } : {}),
      name: route.title,
      description: route.description,
      ...(websiteId ? { isPartOf: { '@id': websiteId } } : {}),
    })
  }

  if (route.structuredData.includes('Service') && route.serviceName) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Service',
      ...(canonical ? { url: canonical } : {}),
      name: route.serviceName,
      description: route.description,
      provider: organizationId ? { '@id': organizationId } : { '@type': 'Organization', name: organizationName },
    })
  }

  if (route.structuredData.includes('BreadcrumbList') && canonical && route.breadcrumbs) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: route.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: canonicalUrl(item.path, origin),
      })),
    })
  }

  return schemas
}

export function serializeStructuredData(value: Record<string, unknown>[]): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}