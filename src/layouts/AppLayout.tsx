import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export function AppLayout() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen)

  return (
    <div className="relative flex h-screen bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(hsl(var(--foreground))_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
      <Sidebar />
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/35 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Закрыть меню"
        />
      )}
      <div
        className={cn(
          'relative z-[1] flex flex-col flex-1 overflow-hidden transition-all duration-300',
          sidebarOpen ? 'md:ml-[240px] lg:ml-64 xl:ml-72' : 'md:ml-[68px]'
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6 max-w-[1680px] w-full mx-auto animate-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
