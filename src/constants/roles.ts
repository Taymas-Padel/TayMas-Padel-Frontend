import type { Role } from '@/types/auth'

export const ROLES = {
  ADMIN: 'ADMIN' as Role,
  RECEPTIONIST: 'RECEPTIONIST' as Role,
  SALES_MANAGER: 'SALES_MANAGER' as Role,
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Администратор',
  RECEPTIONIST: 'Ресепшн',
  SALES_MANAGER: 'Менеджер по продажам',
}

// Access matrix per module
export const MODULE_ROLES: Record<string, Role[]> = {
  dashboard_reception: ['ADMIN', 'RECEPTIONIST'],
  dashboard_director: ['ADMIN'],
  clients: ['ADMIN', 'RECEPTIONIST', 'SALES_MANAGER'],
  leads: ['ADMIN', 'RECEPTIONIST', 'SALES_MANAGER'],
  bookings: ['ADMIN', 'RECEPTIONIST'],
  memberships: ['ADMIN', 'RECEPTIONIST'],
  finance: ['ADMIN', 'RECEPTIONIST'],
  qr_scanner: ['ADMIN', 'RECEPTIONIST'],
  manage_courts: ['ADMIN'],
  manage_services: ['ADMIN'],
  manage_marketing: ['ADMIN'],
  manage_news: ['ADMIN'],
  manage_memberships: ['ADMIN'],
  club_settings: ['ADMIN'],
  tournaments: ['ADMIN', 'RECEPTIONIST'],
  manage_staff: ['ADMIN'],
}
