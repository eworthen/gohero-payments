import { PassThrough } from 'node:stream'
import { createElement } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { createServer } from 'vite'

async function renderRoute(path) {
  const vite = await createServer({
    mode: 'production',
    logLevel: 'silent',
    server: { middlewareMode: true },
    appType: 'custom',
  })

  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/App.tsx')
    return await new Promise((resolve, reject) => {
      const chunks = []
      const output = new PassThrough()
      let renderer
      const timeout = setTimeout(() => {
        renderer.abort()
        reject(new Error('Route renderer timed out.'))
      }, 20_000)
      output.on('data', (chunk) => chunks.push(chunk))
      output.on('error', (error) => { clearTimeout(timeout); reject(error) })
      output.on('end', () => { clearTimeout(timeout); resolve(Buffer.concat(chunks).toString('utf8')) })
      renderer = renderToPipeableStream(
        createElement(StaticRouter, { location: path }, createElement(AppRoutes)),
        { onAllReady: () => renderer.pipe(output), onShellError: reject },
      )
    })
  } finally {
    await vite.close()
  }
}

const route = process.argv[2]
if (!route?.startsWith('/')) throw new Error('Provide an absolute public route path.')
process.stdout.write(await renderRoute(route))