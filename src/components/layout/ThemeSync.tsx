import { useLayoutEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

/** Applies `dark` class on <html> from persisted theme store. */
export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return null
}
