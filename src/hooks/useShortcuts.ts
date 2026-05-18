import { useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

interface ShortcutHandlers {
  onOpenCommandPalette?: () => void
  onOpenCreate?: () => void
  onOpenSearch?: () => void
  onOpenHelp?: () => void
}

/**
 * Global keyboard shortcuts per spec:
 * - Cmd+K — Command Palette
 * - Cmd+N — Create (context-aware)
 * - Cmd+F — Focus search input
 * - Cmd+/ — Shortcuts help modal
 * - Esc — Close drawer/modal
 * - J/K or ↑/↓ — Navigate rows (handled by individual components)
 * - Enter — Open selected row (handled by individual components)
 */
export function useShortcuts(handlers: ShortcutHandlers = {}) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Cmd+K — Command Palette (always available)
      if (isMeta && e.key === 'k') {
        e.preventDefault()
        handlers.onOpenCommandPalette?.()
        return
      }

      // Don't trigger shortcuts when typing in inputs (except Cmd+K)
      if (isInput) return

      // Cmd+N — Create (context-aware)
      if (isMeta && e.key === 'n') {
        e.preventDefault()
        const path = location.pathname
        
        if (path.includes('/clients')) {
          handlers.onOpenCreate?.()
        } else if (path.includes('/bookings')) {
          navigate(ROUTES.BOOKINGS_SCHEDULE)
        } else if (path.includes('/leads')) {
          handlers.onOpenCreate?.()
        } else {
          // Default: go to schedule to create booking
          navigate(ROUTES.BOOKINGS_SCHEDULE)
        }
        return
      }

      // Cmd+F — Focus search
      if (isMeta && e.key === 'f') {
        e.preventDefault()
        handlers.onOpenSearch?.()
        return
      }

      // Cmd+/ — Show shortcuts help
      if (isMeta && e.key === '/') {
        e.preventDefault()
        handlers.onOpenHelp?.()
        return
      }
    },
    [handlers, location.pathname, navigate]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Shortcut info for help modal
 */
export const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Открыть поиск команд' },
  { keys: ['⌘', 'N'], description: 'Создать (контекстно)' },
  { keys: ['⌘', 'F'], description: 'Поиск в списке' },
  { keys: ['⌘', '/'], description: 'Показать горячие клавиши' },
  { keys: ['Esc'], description: 'Закрыть панель / модалку' },
  { keys: ['↑', '↓'], description: 'Навигация по строкам' },
  { keys: ['Enter'], description: 'Открыть выбранное' },
  { keys: ['J', 'K'], description: 'Навигация (vim-style)' },
] as const
