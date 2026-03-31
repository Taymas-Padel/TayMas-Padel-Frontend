import { apiClient } from './client'
import type { Transaction, FinanceSummary } from '@/types/finance'

export async function getTransactions(params?: {
  date?: string
  type?: string
  method?: string
  user_id?: number
  page_size?: number
}): Promise<Transaction[]> {
  const { data } = await apiClient.get<Transaction[] | { results: Transaction[]; count: number }>(
    '/finance/transactions/',
    { params: { page_size: 200, ...params } }
  )
  return Array.isArray(data) ? data : data.results
}

export async function getFinanceSummary(period: 'today' | 'month' | 'all'): Promise<FinanceSummary> {
  const { data } = await apiClient.get<FinanceSummary>('/finance/summary/', { params: { period } })
  return data
}
