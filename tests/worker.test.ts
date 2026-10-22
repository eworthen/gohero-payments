import { describe, expect, it } from 'vitest'
import { handleRequest } from '../worker/index'
import type { Env } from '../worker/types'

const env = { ASSETS: { fetch: async () => new Response('asset') } }
const privateEnv = { ...env, APP_ENV: 'production' as const } as unknown as Env

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
    expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'The requested endpoint was not found.' } })
  })

  it('passes non-API requests to static assets', async () => {
    const response = await handleRequest(new Request('https://example.test/about'), env)
    expect(await response.text()).toBe('asset')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
  })

  it('fails closed for private API and admin document without Access configuration', async () => {
    const api = await handleRequest(new Request('https://example.test/api/admin/me'), privateEnv)
    const page = await handleRequest(new Request('https://example.test/admin'), privateEnv)
    expect(api.status).toBe(401)
    expect(api.headers.get('cache-control')).toBe('no-store')
    expect(await api.json()).toMatchObject({ error: { code: 'UNAUTHENTICATED' } })
    expect(page.status).toBe(401)
  })

  it('does not enable development identities in production', async () => {
    const request = new Request('https://example.test/api/admin/me', { headers: { 'X-Dev-User': 'admin' } })
    const response = await handleRequest(request, privateEnv)
    expect(response.status).toBe(401)
  })
})