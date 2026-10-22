import type { AuthenticatedUser, UserRole } from '../types'

export function hasRole(user: AuthenticatedUser, ...roles: UserRole[]): boolean {
  return roles.includes(user.role)
}

export function canAccessAssignedRecord(user: AuthenticatedUser, assignedUserId: string | null): boolean {
  return user.role === 'administrator' || assignedUserId === user.id
}