export function json(body: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(body), { status, headers })
}

export function errorResponse(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status)
}

export function badRequest(message = 'The request is invalid.'): Response {
  return errorResponse(400, 'BAD_REQUEST', message)
}

export function forbidden(): Response {
  return errorResponse(403, 'FORBIDDEN', 'You do not have permission to perform this action.')
}

export function notFound(): Response {
  return errorResponse(404, 'NOT_FOUND', 'The requested resource was not found.')
}