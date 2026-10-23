import { buildHeadMetadata } from './head'
import { serializeStructuredData } from './structuredData'
import type { SeoRoute } from './types'

function setMeta(document: Document, selector: string, attribute: 'name' | 'property', key: string, value: string | undefined) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!value) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = value
}

function setCanonical(document: Document, value: string | undefined) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!value) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }
  element.href = value
}

export function applyHead(document: Document, route: SeoRoute) {
  const head = buildHeadMetadata(route)
  document.title = head.title
  setMeta(document, 'meta[name="description"]', 'name', 'description', head.description)
  setMeta(document, 'meta[name="robots"]', 'name', 'robots', head.robots)
  setCanonical(document, head.canonical)
  setMeta(document, 'meta[property="og:site_name"]', 'property', 'og:site_name', 'GoHero Payments')
  setMeta(document, 'meta[property="og:type"]', 'property', 'og:type', 'website')
  setMeta(document, 'meta[property="og:title"]', 'property', 'og:title', head.openGraphTitle)
  setMeta(document, 'meta[property="og:description"]', 'property', 'og:description', head.openGraphDescription)
  setMeta(document, 'meta[property="og:url"]', 'property', 'og:url', head.openGraphUrl)
  setMeta(document, 'meta[property="og:image"]', 'property', 'og:image', head.openGraphImage)
  setMeta(document, 'meta[name="twitter:card"]', 'name', 'twitter:card', head.twitterCard)
  setMeta(document, 'meta[name="twitter:title"]', 'name', 'twitter:title', head.twitterTitle)
  setMeta(document, 'meta[name="twitter:description"]', 'name', 'twitter:description', head.twitterDescription)
  setMeta(document, 'meta[name="twitter:image"]', 'name', 'twitter:image', head.twitterImage)

  let schema = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld]')
  if (head.structuredData.length === 0) {
    schema?.remove()
  } else {
    if (!schema) {
      schema = document.createElement('script')
      schema.type = 'application/ld+json'
      schema.dataset.seoJsonld = 'true'
      document.head.append(schema)
    }
    schema.textContent = serializeStructuredData(head.structuredData)
  }
}


