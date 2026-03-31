import { useQuery } from '@tanstack/react-query'
import { getClients } from '@/api/clients'
import type { ClientUser } from '@/types/client'

export function useManagers() {
  const adminQuery = useQuery({
    queryKey: ['clients', { role: 'ADMIN' }],
    queryFn: () => getClients({ role: 'ADMIN' }),
    staleTime: 5 * 60 * 1000,
  })

  const receptionQuery = useQuery({
    queryKey: ['clients', { role: 'RECEPTIONIST' }],
    queryFn: () => getClients({ role: 'RECEPTIONIST' }),
    staleTime: 5 * 60 * 1000,
  })

  const salesQuery = useQuery({
    queryKey: ['clients', { role: 'SALES_MANAGER' }],
    queryFn: () => getClients({ role: 'SALES_MANAGER' }),
    staleTime: 5 * 60 * 1000,
  })

  const managers: ClientUser[] = [
    ...(adminQuery.data ?? []),
    ...(receptionQuery.data ?? []),
    ...(salesQuery.data ?? []),
  ]

  const isLoading = adminQuery.isLoading || receptionQuery.isLoading || salesQuery.isLoading

  return { managers, isLoading }
}
