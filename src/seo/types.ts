export type StructuredDataKind = 'Organization' | 'WebSite' | 'WebPage' | 'Service' | 'BreadcrumbList'

export interface BreadcrumbItem {
  name: string
  path: string
}

export interface SeoRoute {
  id: string
  path: string
  title: string
  description: string
  indexable: boolean
  openGraphTitle?: string
  openGraphDescription?: string
  openGraphImage?: string
  twitterCard?: 'summary' | 'summary_large_image'
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  structuredData: StructuredDataKind[]
  serviceName?: string
  breadcrumbs?: BreadcrumbItem[]
}

export interface HeadMetadata {
  title: string
  description: string
  robots: string
  canonical?: string
  openGraphTitle: string
  openGraphDescription: string
  openGraphUrl?: string
  openGraphImage?: string
  twitterCard: 'summary' | 'summary_large_image'
  twitterTitle: string
  twitterDescription: string
  twitterImage?: string
  structuredData: Record<string, unknown>[]
}
