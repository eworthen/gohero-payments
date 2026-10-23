import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { PassThrough } from 'node:stream'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = process.cwd()
const outputDirectory = resolve(root, 'dist')
const vite = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' })

function setMeta(document, attribute, key, value) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
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

function setCanonical(document, value) {
  let element = document.head.querySelector('link[rel="canonical"]')
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

function renderReact(element) {
  return new Promise((resolveRender, rejectRender) => {
    const chunks = []
    const output = new PassThrough()
    let controller
    const timeout = setTimeout(() => {
      controller?.abort()
      rejectRender(new Error('Timed out while rendering a public route.'))
    }, 30_000)

    output.on('data', (chunk) => chunks.push(chunk))
    output.on('error', (error) => {
      clearTimeout(timeout)
      rejectRender(error)
    })
    output.on('end', () => {
      clearTimeout(timeout)
      resolveRender(Buffer.concat(chunks).toString('utf8'))
    })

    controller = renderToPipeableStream(element, {
      onAllReady() { controller.pipe(output) },
      onShellError(error) {
        clearTimeout(timeout)
        rejectRender(error)
      },
      onError(error) {
        clearTimeout(timeout)
        rejectRender(error)
      },
    })
  })
}

function outputPath(routePath) {
  if (routePath === '/') return resolve(outputDirectory, 'index.html')
  return resolve(outputDirectory, `${routePath.slice(1)}.html`)
}

try {
  const template = await readFile(resolve(outputDirectory, 'index.html'), 'utf8')
  const [{ AppRoutes }, { publicRouteRegistry, noIndexRoute }, { applyHead }, { buildRobotsTxt, buildSitemapXml }, { siteOrigin }, { isPublicContentPath }] = await Promise.all([
    vite.ssrLoadModule('/src/App.tsx'),
    vite.ssrLoadModule('/src/seo/routes.ts'),
    vite.ssrLoadModule('/src/seo/dom.ts'),
    vite.ssrLoadModule('/src/seo/sitemap.ts'),
    vite.ssrLoadModule('/src/seo/config.ts'),
    vite.ssrLoadModule('/src/seo/paths.ts'),
  ])

  const paths = new Set()
  for (const route of publicRouteRegistry) {
    if (!isPublicContentPath(route.path) || paths.has(route.path)) throw new Error(`Invalid or duplicate public route: ${route.path}`)
    paths.add(route.path)
  }
  for (const route of [...publicRouteRegistry, noIndexRoute]) {
    const markup = await renderReact(createElement(StaticRouter, { location: route.path }, createElement(AppRoutes)))
    const document = new JSDOM(template).window.document
    const rootElement = document.getElementById('root')
    if (!rootElement) throw new Error('Vite HTML template does not contain #root.')
    applyHead(document, route)
    rootElement.dataset.prerendered = 'true'
    rootElement.innerHTML = markup

    const destination = outputPath(route.path)
    await mkdir(resolve(destination, '..'), { recursive: true })
    await writeFile(destination, `<!doctype html>\n${document.documentElement.outerHTML}\n`)
    console.info(`Prerendered ${route.path}`)
  }

  const adminDocument = new JSDOM(template).window.document
  adminDocument.title = 'GoHero Payments Admin'
  setMeta(adminDocument, 'name', 'description', 'Secure GoHero Payments administration workspace.')
  setMeta(adminDocument, 'name', 'robots', 'noindex, nofollow')
  setCanonical(adminDocument, undefined)
  for (const selector of ['meta[property^="og:"]', 'meta[name^="twitter:"]', 'script[data-seo-jsonld]']) {
    adminDocument.head.querySelectorAll(selector).forEach((element) => element.remove())
  }
  const adminRoot = adminDocument.getElementById('root')
  if (!adminRoot) throw new Error('Vite HTML template does not contain #root.')
  adminRoot.replaceChildren()
  adminRoot.removeAttribute('data-prerendered')
  await writeFile(resolve(outputDirectory, 'admin.html'), `<!doctype html>\n${adminDocument.documentElement.outerHTML}\n`)

  await writeFile(resolve(outputDirectory, 'sitemap.xml'), buildSitemapXml(publicRouteRegistry, siteOrigin))
  await writeFile(resolve(outputDirectory, 'robots.txt'), buildRobotsTxt(siteOrigin))
  if (!siteOrigin) console.info('VITE_SITE_URL is unset; canonicals and sitemap URLs are omitted until the production domain is confirmed.')
} finally {
  await vite.close()
}

