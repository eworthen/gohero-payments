import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../src/App'
import { setLocalIdentity } from '../src/admin/services/api'

afterEach(() => {
  cleanup()
  setLocalIdentity(null)
  vi.unstubAllGlobals()
})

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function mockAdminApi() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input), 'http://localhost').pathname
    const identity = new Headers(init?.headers).get('X-Dev-User')
    if (path === '/api/admin/me') {
      if (!identity) return response({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } }, 401)
      return response({ data: {
        id: identity === 'admin' ? 'admin-id' : 'sales-id',
        email: `${identity}@local.invalid`,
        display_name: identity === 'admin' ? 'Local Administrator' : 'Local Sales',
        role: identity === 'admin' ? 'administrator' : 'sales_representative',
      } })
    }
    if (path === '/api/admin/dashboard') return response({ data: { metrics: {}, recent_activity: [], upcoming_follow_ups: [] } })
    return response({ error: { code: 'NOT_FOUND', message: 'Not found.' } }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>)
}

describe('admin routes', () => {
  it('requires an identity selection in local development and renders the dashboard', async () => {
    const fetchMock = mockAdminApi()
    renderAt('/admin')
    fireEvent.click(await screen.findByRole('button', { name: 'Use local administrator' }))
    expect(await screen.findByRole('heading', { name: 'Good day, Local' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => new Headers(init?.headers).get('X-Dev-User') === 'admin')).toBe(true)
  })

  it('hides administrator-only navigation for a sales representative', async () => {
    mockAdminApi()
    renderAt('/admin')
    fireEvent.click(await screen.findByRole('button', { name: 'Use sales representative' }))
    expect(await screen.findByRole('heading', { name: 'Good day, Local' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reports' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
  })

  it('renders an admin-specific not-found route', async () => {
    mockAdminApi()
    renderAt('/admin/not-a-page')
    fireEvent.click(await screen.findByRole('button', { name: 'Use local administrator' }))
    expect(await screen.findByRole('heading', { name: 'Admin page not found' })).toBeInTheDocument()
  })
})