import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PaymentMethodSelect } from '@/components/shared/PaymentMethodSelect'
import { confirmPayment } from '@/api/bookings'
import { parseApiError } from '@/utils/error'

interface ConfirmPaymentModalProps {
  bookingId: number | null
  open: boolean
  onClose: () => void
}

export function ConfirmPaymentModal({ bookingId, open, onClose }: ConfirmPaymentModalProps) {
  const qc = useQueryClient()
  const [method, setMethod] = useState('CASH')

  const mutation = useMutation({
    mutationFn: () => confirmPayment(bookingId!, method),
    onSuccess: () => {
      toast.success('Оплата подтверждена')
      qc.invalidateQueries({ queryKey: ['bookings'] })
      qc.invalidateQueries({ queryKey: ['schedule'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Подтвердить оплату</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Способ оплаты</Label>
          <PaymentMethodSelect value={method} onChange={setMethod} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
