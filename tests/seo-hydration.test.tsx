import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

function renderServerMarkup(path: string): string {
  const script = resolve(process.cwd(), 'scripts/render-route.mjs')
  const result = spawnSync(process.execPath, [script, path], { cwd: process.cwd(), encoding: 'utf8', timeout: 30_000 })
  if (result.status !== 0) throw new Error(result.stderr || `Route renderer exited with ${result.status}.`)
  return result.stdout
}

afterEach(() => {
  document.body.replaceChildren()
  window.history.replaceState({}, '', '/')
  vi.restoreAllMocks()
})

describe('SEO prerender hydration', () => {
  it.each(['/', '/payment-processing', '/business-funding', '/about', '/contact', '/privacy-policy', '/terms-of-service', '/missing-page'])('hydrates %s without React hydration errors', async (path) => {
    const markup = renderServerMarkup(path)
    const container = document.createElement('div')
    container.id = 'root'
    container.dataset.prerendered = 'true'
    container.innerHTML = markup
    document.body.append(container)
    window.history.replaceState({}, '', path)

    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    let root: ReturnType<typeof hydrateRoot>
    try {
      await act(async () => { root = hydrateRoot(container, <App />) })
    } catch (error) {
      throw new Error(`Client hydration failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/hydration|did not match|server rendered html/i)

    await act(async () => root.unmount())
  })
})
