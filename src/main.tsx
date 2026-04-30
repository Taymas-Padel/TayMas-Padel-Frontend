import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import { router } from './router'
import { ThemeRoot } from '@/components/layout/ThemeRoot'
import { useThemeStore } from '@/store/themeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
})

function AppWithTheme() {
  const theme = useThemeStore((s) => s.theme)
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors theme={theme} />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeRoot>
        <AppWithTheme />
      </ThemeRoot>
    </QueryClientProvider>
  </StrictMode>
)
