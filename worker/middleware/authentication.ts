import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import type { AuthenticatedUser, Env, User } from '../types'

const DEV_IDENTITIES: Record<string, string> = {
  admin: 'dev-access-admin',
  sales: 'dev-access-sales',
}

let cachedIssuer: string | undefined
let cachedKeys: JWTVerifyGetKey | undefined

function getJwt(request: Request): string | undefined {
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion')
  if (assertion) return assertion

  const authorization = request.headers.get('Authorization')
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7)

  const cookie = request.headers.get('Cookie')
  return cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length)
}

function getDevSubject(request: Request, env: Env): string | null {
  if (env.APP_ENV !== 'development' || env.DEV_AUTH_ENABLED !== 'true') return null
  const identity = request.headers.get('X-Dev-User')
  if (!identity || !(identity in DEV_IDENTITIES)) return null
  return DEV_IDENTITIES[identity]
}

async function findActiveUser(env: Env, accessIdentityId: string): Promise<User | null> {
  return env.DB.prepare(
    'SELECT id, access_identity_id, email, display_name, role, active, created_at, updated_at FROM users WHERE access_identity_id = ? AND active = 1 LIMIT 1',
  ).bind(accessIdentityId).first<User>()
}

function getRemoteKeys(issuer: string): JWTVerifyGetKey {
  if (cachedKeys && cachedIssuer === issuer) return cachedKeys
  const teamHost = new URL(issuer).host
  cachedIssuer = issuer
  cachedKeys = createRemoteJWKSet(new URL(`https://${teamHost}/cdn-cgi/access/certs`))
  return cachedKeys
}

export async function authenticate(
  request: Request,
  env: Env,
  audienceSetting: string | undefined = env.CF_ACCESS_AUD_API,
  keyOverride?: JWTVerifyGetKey,
): Promise<AuthenticatedUser | null> {
  const localSubject = getDevSubject(request, env)
  if (localSubject) return findActiveUser(env, localSubject)

  if (env.APP_ENV === 'development' && env.DEV_AUTH_ENABLED === 'true' && request.headers.has('X-Dev-User')) {
    return null
  }

  const audiences = audienceSetting?.split(',').map((value) => value.trim()).filter(Boolean)
  if (!env.CF_ACCESS_TEAM_DOMAIN || !audiences?.length) return null
  const token = getJwt(request)
  if (!token) return null

  const issuer = `https://${env.CF_ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  try {
    const { payload } = await jwtVerify(token, keyOverride ?? getRemoteKeys(issuer), {
      issuer,
      audience: audiences,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'iss', 'aud', 'sub', 'email'],
    })

    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null
    const user = await findActiveUser(env, payload.sub)

    if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) return null
    return user
  } catch {
    return null
  }
}