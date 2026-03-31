import type { PaymentMethod } from '@/types/booking'

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  KASPI: 'Kaspi / QR',
  CARD: 'Карта',
  CASH: 'Наличные',
  BONUS: 'Бонусы',
  UNKNOWN: 'Неизвестно',
}

export const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'KASPI', label: 'Kaspi / QR' },
  { value: 'CARD', label: 'Карта' },
  { value: 'CASH', label: 'Наличные' },
]
