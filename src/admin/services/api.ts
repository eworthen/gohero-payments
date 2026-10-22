export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let localIdentity: 'admin' | 'sales' | null = null
const localAuthEnabled = import.meta.env.DEV || import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'

export function setLocalIdentity(identity: 'admin' | 'sales' | null): void {
  localIdentity = identity
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (localAuthEnabled && localIdentity) headers.set('X-Dev-User', localIdentity)
  const response = await fetch(`/api/admin${path}`, { ...init, headers, credentials: 'same-origin' })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'error' in body
      && typeof body.error === 'object' && body.error !== null && 'message' in body.error
      && typeof body.error.message === 'string'
      ? body.error.message
      : 'The request could not be completed.'
    throw new ApiError(response.status, message)
  }
  return body as T
}

export const adminApi = {
  get<T>(path: string) { return apiRequest<T>(path) },
  post<T>(path: string, body: unknown) { return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }) },
  patch<T>(path: string, body: unknown) { return apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }) },
}