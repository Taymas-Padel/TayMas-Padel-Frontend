import { apiClient } from './client'

export type QrLocation = 'GYM' | 'PADEL' | 'ALL'

export interface QrScanResult {
  status: 'SUCCESS' | 'DENIED' | 'BLOCKED'
  user_id?: number
  user?: string
  phone?: string
  details?: string
  error?: string
}

export async function scanQr(qr_content: string, location: QrLocation): Promise<QrScanResult> {
  const { data } = await apiClient.post<QrScanResult>('/gym/qr/scan/', { qr_content, location })
  return data
}
