import { isPublicContentPath } from './paths'

export const organizationName = 'GoHero Payments'

// No verified social-sharing image has been provided yet.
export const defaultOpenGraphImage: string | undefined = undefined

export function normalizeSiteOrigin(value?: string): string | undefined {
  const candidate = value?.trim()
  if (!candidate) return undefined

  try {
    const url = new URL(candidate)
    const host = url.hostname.toLowerCase()
    const isPreviewHost = ['.workers.dev', '.pages.dev', '.trycloudflare.com', '.cloudflarepreview.com', '.localhost', '.local'].some((suffix) => host.endsWith(suffix))
    const isLocalAddress = host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash || isPreviewHost || isLocalAddress) return undefined
    return url.origin
  } catch {
    return undefined
  }
}

export const siteOrigin = normalizeSiteOrigin(import.meta.env.VITE_SITE_URL)

export function canonicalUrl(path: string, origin = siteOrigin): string | undefined {
  if (!normalizeSiteOrigin(origin) || !isPublicContentPath(path)) return undefined
  return new URL(path, origin).toString()
}

export function absoluteSocialImage(image: string | undefined, origin = siteOrigin): string | undefined {
  if (!image) return undefined
  try {
    const url = new URL(image, origin)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}
