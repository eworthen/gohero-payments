import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'

const siteUrl = (process.env.VITE_SITE_URL || loadEnv('production', process.cwd(), '').VITE_SITE_URL || '').replace(/\/$/, '')

if (!siteUrl) {
  console.info('VITE_SITE_URL is unset; skipping sitemap generation.')
  process.exit(0)
}

const parsedSiteUrl = new URL(siteUrl)
if (parsedSiteUrl.protocol !== 'https:' || parsedSiteUrl.pathname !== '/' || parsedSiteUrl.search || parsedSiteUrl.hash) {
  throw new Error('VITE_SITE_URL must be a confirmed HTTPS origin without a path, query, or fragment.')
}

const paths = ['/', '/payment-processing', '/business-funding', '/about', '/contact', '/privacy-policy', '/terms-of-service']
const urls = paths.map((path) => `  <url><loc>${new URL(path, parsedSiteUrl.origin).toString()}</loc></url>`).join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

writeFileSync(resolve('public/sitemap.xml'), sitemap)
console.info(`Generated sitemap for ${siteUrl}.`)