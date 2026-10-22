const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim()

function getSiteOrigin(value?: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) return undefined
    return url.origin
  } catch {
    return undefined
  }
}

export const siteConfig = {
  name: 'GoHero Payments',
  description: 'Merchant payment processing and business funding solutions for businesses.',
  siteUrl: getSiteOrigin(configuredSiteUrl),
  organization: {
    name: 'GoHero Payments',
    legalName: undefined as string | undefined,
  },
  disclosures: [] as string[],
}