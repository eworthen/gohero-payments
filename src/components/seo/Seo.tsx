import { useEffect } from 'react'
import type { PageMetadata } from '../../config/seo'
import { siteConfig } from '../../config/site'

function setMeta(name: string, content: string, attribute = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.append(element)
  }
  element.content = content
}

export default function Seo({ title, description, path, noIndex }: PageMetadata) {
  useEffect(() => {
    document.title = title
    setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('twitter:card', 'summary')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    setMeta('robots', noIndex ? 'noindex, follow' : 'index, follow')

    if (siteConfig.siteUrl) {
      const canonicalUrl = new URL(path, siteConfig.siteUrl).toString()
      let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.append(canonical)
      }
      canonical.href = canonicalUrl
      setMeta('og:url', canonicalUrl, 'property')

      let organization = document.head.querySelector<HTMLScriptElement>('script[data-organization-schema]')
      if (!organization) {
        organization = document.createElement('script')
        organization.type = 'application/ld+json'
        organization.dataset.organizationSchema = 'true'
        document.head.append(organization)
      }
      organization.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteConfig.organization.name,
        legalName: siteConfig.organization.legalName,
        url: siteConfig.siteUrl,
      }).replace(/</g, '\\u003c')
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove()
      document.head.querySelector('meta[property="og:url"]')?.remove()
      document.head.querySelector('script[data-organization-schema]')?.remove()
    }

    return () => {
      document.head.querySelector('link[rel="canonical"]')?.remove()
      document.head.querySelector('script[data-organization-schema]')?.remove()
    }
  }, [description, noIndex, path, title])

  return null
}