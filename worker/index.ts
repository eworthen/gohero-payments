import { authenticate } from './middleware/authentication'
import { errorResponse, forbidden, json } from './http'
import { handleAdminAudit } from './routes/admin-audit'
import { handleAdminFollowUps } from './routes/admin-follow-ups'
import { handleAdminDashboard, handleAdminReports } from './routes/admin-reports'
import { handleAdminLeads } from './routes/admin-leads'
import { handleAdminUsers } from './routes/admin-users'
import type { ApiContext, Env } from './types'

export type { Env } from './types'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function noStore(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function sameOriginMutation(request: Request, url: URL): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true
  const origin = request.headers.get('Origin')
  if (!origin) return false
  try {
    return new URL(origin).origin === url.origin
  } catch {
    return false
  }
}

async function dispatchAdminApi(context: ApiContext): Promise<Response> {
  const path = context.url.pathname.split('/').filter(Boolean).slice(2)
  const [resource, ...rest] = path
  if (resource === 'me' && rest.length === 0 && context.request.method === 'GET') {
    const { id, email, display_name, role } = context.user
    return json({ data: { id, email, display_name, role } })
  }
  if (resource === 'dashboard' && rest.length === 0 && context.request.method === 'GET') return handleAdminDashboard(context)
  if (resource === 'leads') return handleAdminLeads(context, rest)
  if (resource === 'follow-ups') return handleAdminFollowUps(context, rest)
  if (resource === 'reports' && rest.length === 0 && context.request.method === 'GET') return handleAdminReports(context)
  if (resource === 'users') return handleAdminUsers(context, rest)
  if (resource === 'audit' && rest.length === 0 && context.request.method === 'GET') return handleAdminAudit(context)
  return errorResponse(404, 'NOT_FOUND', 'The requested endpoint was not found.')
}

async function handleAdminDocument(request: Request, env: Env): Promise<Response> {
  const isExplicitLocal = env.APP_ENV === 'development' && env.DEV_AUTH_ENABLED === 'true'
  const user = isExplicitLocal ? true : await authenticate(request, env, env.CF_ACCESS_AUD_ADMIN)
  if (!user) return errorResponse(401, 'UNAUTHENTICATED', 'Authentication is required.')
  return noStore(await env.ASSETS.fetch(request))
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  try {
    if (url.pathname === '/api/admin' || url.pathname.startsWith('/api/admin/')) {
      if (!sameOriginMutation(request, url)) return withSecurityHeaders(noStore(forbidden()))
      const user = await authenticate(request, env, env.CF_ACCESS_AUD_API)
      if (!user) return withSecurityHeaders(noStore(errorResponse(401, 'UNAUTHENTICATED', 'Authentication is required.')))
      if (!user.active) return withSecurityHeaders(noStore(forbidden()))
      return withSecurityHeaders(noStore(await dispatchAdminApi({ request, env, user, url })))
    }

    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      return withSecurityHeaders(await handleAdminDocument(request, env))
    }

    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'GET' && url.pathname === '/api/health') {
        return withSecurityHeaders(json({ status: 'ok', service: 'gohero-payments' }))
      }
      return withSecurityHeaders(errorResponse(404, 'NOT_FOUND', 'The requested endpoint was not found.'))
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request))
  } catch {
    return withSecurityHeaders(errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred.'))
  }
}

export default { fetch: handleRequest } satisfies ExportedHandler<Env>