import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, AlertCircle, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { scanQr } from '@/api/qr'
import { userAction } from '@/api/clients'
import { parseApiError } from '@/utils/error'
import type { QrScanResult, QrLocation } from '@/api/qr'

const LOCATION_OPTIONS: Array<{ value: QrLocation; label: string }> = [
  { value: 'PADEL', label: 'Падел-корт' },
  { value: 'GYM', label: 'Тренажёрный зал' },
  { value: 'ALL', label: 'Любой вход' },
]

export function QrScannerPage() {
  const qc = useQueryClient()
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const [location, setLocation] = useState<QrLocation>('PADEL')
  const [result, setResult] = useState<QrScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)

  const scanMutation = useMutation({
    mutationFn: (qrContent: string) => scanQr(qrContent, location),
    onSuccess: (data) => setResult(data),
    onError: (err) => toast.error(parseApiError(err)),
  })

  const unblockMutation = useMutation({
    mutationFn: (userId: number) => userAction(userId, 'unblock_qr'),
    onSuccess: () => {
      toast.success('QR-код разблокирован')
      setResult(null)
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  // Stop scanner on unmount
  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  async function startScanner() {
    if (starting || scanning) return
    setResult(null)
    setStarting(true)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      // Stop previous instance if any
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }

      const scanner = new Html5Qrcode('qr-scanner-container')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {})
          scannerRef.current = null
          setScanning(false)
          scanMutation.mutate(decodedText)
        },
        () => {}
      )

      setScanning(true)
    } catch {
      toast.error('Не удалось запустить камеру. Проверьте разрешения браузера.')
      scannerRef.current = null
    } finally {
      setStarting(false)
    }
  }

  async function stopScanner() {
    await scannerRef.current?.stop().catch(() => {})
    scannerRef.current = null
    setScanning(false)
  }

  const StatusIcon = {
    SUCCESS: CheckCircle,
    DENIED: XCircle,
    BLOCKED: AlertCircle,
  }

  const STATUS_COLORS = {
    SUCCESS: 'border-green-300 bg-green-50',
    DENIED: 'border-red-300 bg-red-50',
    BLOCKED: 'border-orange-300 bg-orange-50',
  }

  const STATUS_ICON_COLORS = {
    SUCCESS: 'text-green-600',
    DENIED: 'text-red-600',
    BLOCKED: 'text-orange-600',
  }

  const STATUS_LABELS = {
    SUCCESS: 'Доступ разрешён',
    DENIED: 'Доступ запрещён',
    BLOCKED: 'QR-код заблокирован',
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader title="QR-сканер" description="Сканирование QR-кодов клиентов" />

      {/* Location selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium shrink-0">Точка входа:</span>
        <Select value={location} onValueChange={(v) => setLocation(v as QrLocation)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scanner area — container always in DOM so html5-qrcode always finds it */}
      <Card>
        <CardContent className="p-4">
          <div className="relative min-h-[300px]">
            <div id="qr-scanner-container" className="w-full rounded-lg overflow-hidden" />

            {/* Placeholder overlay — shown when not actively scanning */}
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <ScanLine className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {starting ? 'Запуск камеры...' : 'Нажмите кнопку, чтобы начать сканирование'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-3">
        {!scanning ? (
          <Button
            className="flex-1"
            onClick={startScanner}
            disabled={starting || scanMutation.isPending}
          >
            <ScanLine className="h-4 w-4" />
            {starting ? 'Запуск...' : 'Начать сканирование'}
          </Button>
        ) : (
          <Button variant="outline" className="flex-1" onClick={stopScanner}>
            Остановить
          </Button>
        )}
      </div>

      {/* Result */}
      {result && (() => {
        const Icon = StatusIcon[result.status]
        const colorClass = STATUS_COLORS[result.status]
        const iconColorClass = STATUS_ICON_COLORS[result.status]

        return (
          <Card className={`border-2 ${colorClass}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Icon className={`h-8 w-8 shrink-0 mt-0.5 ${iconColorClass}`} />
                <div className="flex-1">
                  <p className={`font-bold text-lg ${iconColorClass}`}>
                    {STATUS_LABELS[result.status]}
                  </p>
                  {result.user && (
                    <p className="font-medium mt-1">{result.user}</p>
                  )}
                  {result.phone && (
                    <p className="text-sm text-muted-foreground">{result.phone}</p>
                  )}
                  {result.details && (
                    <p className="text-sm mt-1">{result.details}</p>
                  )}
                  {result.error && (
                    <p className="text-sm text-destructive mt-1">{result.error}</p>
                  )}

                  {result.status === 'BLOCKED' && result.user_id && (
                    <Button
                      className="mt-3"
                      size="sm"
                      variant="outline"
                      onClick={() => unblockMutation.mutate(result.user_id!)}
                      disabled={unblockMutation.isPending}
                    >
                      Разблокировать QR
                    </Button>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={startScanner}
              >
                Сканировать ещё
              </Button>
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}
