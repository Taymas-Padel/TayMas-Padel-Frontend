import { useAuth } from './useAuth'
import { MODULE_ROLES } from '@/constants/roles'
import type { Role } from '@/types/auth'

export function usePermissions() {
  const { role } = useAuth()

  function hasRole(...roles: Role[]): boolean {
    if (!role) return false
    return roles.includes(role)
  }

  function can(module: string): boolean {
    if (!role) return false
    const allowed = MODULE_ROLES[module]
    if (!allowed) return false
    return allowed.includes(role)
  }

  return { hasRole, can, role }
}
