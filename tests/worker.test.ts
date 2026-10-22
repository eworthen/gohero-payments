import { describe, expect, it } from 'vitest'
import { handleRequest } from '../worker/index'

const env = { ASSETS: { fetch: async () => new Response('asset') } }

describe('Worker request handling', () => {
  it('serves the health endpoint', async () => {
    const response = await handleRequest(new Request('https://example.test/api/health'), env)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok', service: 'gohero-payments' })
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('returns JSON 404 for unknown API endpoints', async () => {
    const response = await handleRequest(new Request('https://example.test/api/other'), env)
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ error: 'Not found' })
  })

  it('passes non-API requests to static assets', async () => {
    const response = await handleRequest(new Request('https://example.test/about'), env)
    expect(await response.text()).toBe('asset')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
  })
})