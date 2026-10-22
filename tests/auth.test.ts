import { generateKeyPair, SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import { authenticate } from '../worker/middleware/authentication'
import type { Env, User } from '../worker/types'

const teamDomain = 'team.example.cloudflareaccess.com'
const issuer = `https://${teamDomain}`
const audience = 'api-audience'
const activeUser: User = {
  id: '00000000-0000-4000-8000-000000000001',
  access_identity_id: 'identity-subject',
  email: 'admin@example.test',
  display_name: 'Authorized Admin',
  role: 'administrator',
  active: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

function makeEnv(user: User | null = activeUser): Env {
  return {
    ASSETS: { fetch: async () => new Response('asset') },
    APP_ENV: 'production',
    CF_ACCESS_TEAM_DOMAIN: teamDomain,
    CF_ACCESS_AUD_API: audience,
    DB: {
      prepare: () => ({ bind: () => ({ first: async () => user }) }),
    } as unknown as D1Database,
  }
}

describe('Cloudflare Access JWT verification', () => {
  it('verifies a valid signature and maps claims to a provisioned D1 user', async () => {
    const { privateKey, publicKey } = await generateKeyPair('RS256')
    const token = await new SignJWT({ email: activeUser.email })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject(activeUser.access_identity_id)
      .setIssuedAt()
      .setExpirationTime('2m')
      .sign(privateKey)
    const request = new Request('https://app.example.test/api/admin/me', { headers: { Authorization: `Bearer ${token}` } })
    const keyResolver = async () => publicKey
    await expect(authenticate(request, makeEnv(), audience, keyResolver)).resolves.toMatchObject({ id: activeUser.id, role: 'administrator' })
  })

  it('rejects audience mismatch and expired assertions', async () => {
    const { privateKey, publicKey } = await generateKeyPair('RS256')
    const wrongAudience = await new SignJWT({ email: activeUser.email }).setProtectedHeader({ alg: 'RS256' }).setIssuer(issuer).setAudience('wrong').setSubject(activeUser.access_identity_id).setIssuedAt().setExpirationTime('2m').sign(privateKey)
    const expired = await new SignJWT({ email: activeUser.email }).setProtectedHeader({ alg: 'RS256' }).setIssuer(issuer).setAudience(audience).setSubject(activeUser.access_identity_id).setIssuedAt().setExpirationTime('0s').sign(privateKey)
    const keyResolver = async () => publicKey
    await expect(authenticate(new Request('https://app.example.test', { headers: { Authorization: `Bearer ${wrongAudience}` } }), makeEnv(), audience, keyResolver)).resolves.toBeNull()
    await expect(authenticate(new Request('https://app.example.test', { headers: { Authorization: `Bearer ${expired}` } }), makeEnv(), audience, keyResolver)).resolves.toBeNull()
  })

  it('rejects unknown identities, email mismatches, invalid signatures, and absent configuration', async () => {
    const keys = await generateKeyPair('RS256')
    const otherKeys = await generateKeyPair('RS256')
    const token = await new SignJWT({ email: activeUser.email }).setProtectedHeader({ alg: 'RS256' }).setIssuer(issuer).setAudience(audience).setSubject(activeUser.access_identity_id).setIssuedAt().setExpirationTime('2m').sign(keys.privateKey)
    const request = new Request('https://app.example.test', { headers: { 'Cf-Access-Jwt-Assertion': token } })
    const resolver = async () => keys.publicKey
    await expect(authenticate(request, makeEnv(null), audience, resolver)).resolves.toBeNull()
    await expect(authenticate(request, makeEnv({ ...activeUser, email: 'mismatch@example.test' }), audience, resolver)).resolves.toBeNull()
    await expect(authenticate(request, makeEnv(), audience, async () => otherKeys.publicKey)).resolves.toBeNull()
    await expect(authenticate(request, { ...makeEnv(), CF_ACCESS_AUD_API: undefined }, undefined, resolver)).resolves.toBeNull()
  })

  it('accepts only fixed development identities when explicitly enabled outside production', async () => {
    const env = { ...makeEnv(), APP_ENV: 'development' as const, DEV_AUTH_ENABLED: 'true' }
    const localRequest = new Request('http://localhost/api/admin/me', { headers: { 'X-Dev-User': 'admin' } })
    const unknownRequest = new Request('http://localhost/api/admin/me', { headers: { 'X-Dev-User': 'someone-else' } })
    await expect(authenticate(localRequest, env)).resolves.toMatchObject({ role: 'administrator' })
    await expect(authenticate(unknownRequest, env)).resolves.toBeNull()
    await expect(authenticate(localRequest, { ...env, APP_ENV: 'production' })).resolves.toBeNull()
  })
})