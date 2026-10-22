export type UserRole = 'administrator' | 'sales_representative'

export interface User {
  id: string
  access_identity_id: string
  email: string
  display_name: string
  role: UserRole
  active: number
  created_at: string
  updated_at: string
}

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  DB: D1Database
  APP_ENV?: 'development' | 'production'
  DEV_AUTH_ENABLED?: string
  CF_ACCESS_TEAM_DOMAIN?: string
  CF_ACCESS_AUD_ADMIN?: string
  CF_ACCESS_AUD_API?: string
}

export interface AuthenticatedUser extends User {}

export interface ApiContext {
  request: Request
  env: Env
  user: AuthenticatedUser
  url: URL
}