import { useLayoutEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

/** Syncs persisted theme → <html class="dark"> */
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return children
}
