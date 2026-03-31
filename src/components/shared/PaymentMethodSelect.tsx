import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PAYMENT_METHOD_OPTIONS } from '@/constants/payments'

interface PaymentMethodSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  includeAll?: boolean
}

export function PaymentMethodSelect({
  value,
  onChange,
  placeholder = 'Способ оплаты',
  includeAll = false,
}: PaymentMethodSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">Все способы</SelectItem>}
        {PAYMENT_METHOD_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
