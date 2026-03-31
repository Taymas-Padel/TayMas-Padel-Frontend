export type TransactionType = 'BOOKING' | 'MEMBERSHIP' | 'TOURNAMENT' | 'REFUND' | 'SALARY' | 'OTHER'

export interface Transaction {
  id: number
  amount: string
  transaction_type: TransactionType
  transaction_type_label: string
  payment_method: string
  payment_method_label: string
  description: string
  created_at: string
  created_at_formatted: string
  amount_court: string
  amount_coach: string
  amount_services: string
  amount_discount: string
  booking: number | null
  user_membership: number | null
}

export interface FinanceSummary {
  period: string
  total: number
  by_payment_method: Record<string, number>
  by_type: Record<string, number>
}
