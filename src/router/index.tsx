import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGuard } from './RoleGuard'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { ROUTES } from '@/constants/routes'

// Lazy-loaded pages for code splitting
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const ReceptionDashboard = lazy(() =>
  import('@/features/dashboard/ReceptionDashboard').then((m) => ({ default: m.ReceptionDashboard }))
)
const DirectorDashboard = lazy(() =>
  import('@/features/dashboard/DirectorDashboard').then((m) => ({ default: m.DirectorDashboard }))
)
const ClientsPage = lazy(() =>
  import('@/features/clients/ClientsPage').then((m) => ({ default: m.ClientsPage }))
)
const ClientDetail = lazy(() =>
  import('@/features/clients/ClientDetail').then((m) => ({ default: m.ClientDetail }))
)
const LeadsPage = lazy(() =>
  import('@/features/leads/LeadsPage').then((m) => ({ default: m.LeadsPage }))
)
const SchedulePage = lazy(() =>
  import('@/features/bookings/SchedulePage').then((m) => ({ default: m.SchedulePage }))
)
const BookingsListPage = lazy(() =>
  import('@/features/bookings/BookingsListPage').then((m) => ({ default: m.BookingsListPage }))
)
const MembershipsPage = lazy(() =>
  import('@/features/memberships/MembershipsPage').then((m) => ({ default: m.MembershipsPage }))
)
const IssueMembershipPage = lazy(() =>
  import('@/features/memberships/IssueMembershipPage').then((m) => ({
    default: m.IssueMembershipPage,
  }))
)
const FinancePage = lazy(() =>
  import('@/features/finance/FinancePage').then((m) => ({ default: m.FinancePage }))
)
const QrScannerPage = lazy(() =>
  import('@/features/qr-scanner/QrScannerPage').then((m) => ({ default: m.QrScannerPage }))
)
const CourtsPage = lazy(() =>
  import('@/features/courts/CourtsPage').then((m) => ({ default: m.CourtsPage }))
)
const ServicesPage = lazy(() =>
  import('@/features/services/ServicesPage').then((m) => ({ default: m.ServicesPage }))
)
const MarketingPage = lazy(() =>
  import('@/features/marketing/MarketingPage').then((m) => ({ default: m.MarketingPage }))
)
const NewsPage = lazy(() =>
  import('@/features/news/NewsPage').then((m) => ({ default: m.NewsPage }))
)
const MembershipTypesPage = lazy(() =>
  import('@/features/memberships/MembershipTypesPage').then((m) => ({
    default: m.MembershipTypesPage,
  }))
)
const CoreSettingsPage = lazy(() =>
  import('@/features/core/CoreSettingsPage').then((m) => ({ default: m.CoreSettingsPage }))
)
const TournamentsPage = lazy(() =>
  import('@/features/tournaments/TournamentsPage').then((m) => ({ default: m.TournamentsPage }))
)
const TournamentDetailPage = lazy(() =>
  import('@/features/tournaments/TournamentDetailPage').then((m) => ({ default: m.TournamentDetailPage }))
)
const StaffPage = lazy(() =>
  import('@/features/staff/StaffPage').then((m) => ({ default: m.StaffPage }))
)
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
)

function PageLoader() {
  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  )
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Redirect root to dashboard
          { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },

          // Dashboard
          {
            path: 'dashboard',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <Lazy><ReceptionDashboard /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'dashboard/director',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <Lazy><DirectorDashboard /></Lazy>
              </RoleGuard>
            ),
          },

          // Clients
          {
            path: 'clients',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST', 'SALES_MANAGER']}>
                <Lazy><ClientsPage /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'clients/:id',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST', 'SALES_MANAGER']}>
                <Lazy><ClientDetail /></Lazy>
              </RoleGuard>
            ),
          },

          // Leads
          {
            path: 'leads',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST', 'SALES_MANAGER']}>
                <Lazy><LeadsPage /></Lazy>
              </RoleGuard>
            ),
          },

          // Bookings
          {
            path: 'bookings/schedule',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <Lazy><SchedulePage /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'bookings',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <Lazy><BookingsListPage /></Lazy>
              </RoleGuard>
            ),
          },

          // Memberships
          {
            path: 'memberships',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <Lazy><MembershipsPage /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'memberships/issue',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <Lazy><IssueMembershipPage /></Lazy>
              </RoleGuard>
            ),
          },

          // Finance
          {
            path: 'finance',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <Lazy><FinancePage /></Lazy>
              </RoleGuard>
            ),
          },

          // QR Scanner
          {
            path: 'qr-scanner',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <Lazy><QrScannerPage /></Lazy>
              </RoleGuard>
            ),
          },

          // Admin manage
          {
            path: 'manage/courts',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <Lazy><CourtsPage /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'manage/services',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <Lazy><ServicesPage /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'manage/marketing',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <Lazy><MarketingPage /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'manage/news',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <Lazy><NewsPage /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'manage/memberships',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <Lazy><MembershipTypesPage /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'manage/settings',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <Lazy><CoreSettingsPage /></Lazy>
              </RoleGuard>
            ),
          },

          // Staff management
          {
            path: 'manage/staff',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <Lazy><StaffPage /></Lazy>
              </RoleGuard>
            ),
          },

          // Tournaments
          {
            path: 'tournaments',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <Lazy><TournamentsPage /></Lazy>
              </RoleGuard>
            ),
          },
          {
            path: 'tournaments/:id',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <Lazy><TournamentDetailPage /></Lazy>
              </RoleGuard>
            ),
          },

          // Profile
          {
            path: 'profile',
            element: <Lazy><ProfilePage /></Lazy>,
          },

          // Catch-all
          { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
        ],
      },
    ],
  },
])
