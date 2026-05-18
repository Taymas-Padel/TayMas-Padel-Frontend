import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { NavRail } from '@/components/layout/NavRail'
import { TopBar } from '@/components/layout/TopBar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

const RAIL_WIDTH = 56

export function AppLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen)

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), [])

  // Global keyboard shortcut for Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative flex h-screen bg-background overflow-hidden">
      {/* Desktop Nav Rail */}
      <NavRail />

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Закрыть меню"
        />
      )}

      {/* Main content area */}
      <div
        style={{ marginLeft: RAIL_WIDTH }}
        className={cn(
          'relative z-[1] flex flex-col flex-1 overflow-hidden',
          'md:ml-14 ml-0' // 56px on desktop, full width on mobile
        )}
      >
        <TopBar onOpenCommandPalette={openCommandPalette} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 md:px-6 md:py-5 max-w-[1680px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </div>
  )
}
