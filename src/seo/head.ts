import { absoluteSocialImage, canonicalUrl, defaultOpenGraphImage, siteOrigin } from './config'
import { buildStructuredData } from './structuredData'
import type { HeadMetadata, SeoRoute } from './types'

export function buildHeadMetadata(route: SeoRoute, origin = siteOrigin): HeadMetadata {
  const canonical = canonicalUrl(route.path, origin)
  const image = absoluteSocialImage(route.openGraphImage ?? defaultOpenGraphImage, origin)
  const twitterImage = absoluteSocialImage(route.twitterImage ?? route.openGraphImage ?? defaultOpenGraphImage, origin)
  return {
    title: route.title,
    description: route.description,
    robots: route.indexable ? 'index, follow' : 'noindex, nofollow',
    ...(canonical ? { canonical } : {}),
    openGraphTitle: route.openGraphTitle ?? route.title,
    openGraphDescription: route.openGraphDescription ?? route.description,
    ...(canonical ? { openGraphUrl: canonical } : {}),
    ...(image ? { openGraphImage: image } : {}),
    ...(twitterImage ? { twitterImage } : {}),
    twitterCard: twitterImage ? (route.twitterCard ?? 'summary_large_image') : 'summary',
    twitterTitle: route.twitterTitle ?? route.openGraphTitle ?? route.title,
    twitterDescription: route.twitterDescription ?? route.openGraphDescription ?? route.description,
    structuredData: buildStructuredData(route, origin),
  }
}
