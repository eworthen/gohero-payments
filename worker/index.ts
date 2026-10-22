export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
}

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

function jsonResponse(body: unknown, status = 200): Response {
  return withSecurityHeaders(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  }))
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  try {
    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'GET' && url.pathname === '/api/health') {
        return jsonResponse({ status: 'ok', service: 'gohero-payments' })
      }
      return jsonResponse({ error: 'Not found' }, 404)
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request))
  } catch {
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
}

export default { fetch: handleRequest } satisfies ExportedHandler<Env>