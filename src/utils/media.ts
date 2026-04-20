const FALLBACK_API_URL = 'https://213.155.23.227/api'

function getApiOrigin(): string {
  const raw = import.meta.env.VITE_API_URL ?? FALLBACK_API_URL
  try {
    return new URL(raw).origin
  } catch {
    return ''
  }
}

const API_ORIGIN = getApiOrigin()

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined

  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }

  if (!import.meta.env.DEV) {
    return url
  }

  // In dev (including ngrok), serve media through the same host.
  // This avoids mixed-content and inaccessible direct backend URLs on phones.
  if (url.startsWith('/')) {
    return url
  }

  try {
    const parsed = new URL(url)
    if (API_ORIGIN && parsed.origin === API_ORIGIN) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    return url
  }

  return url
}
