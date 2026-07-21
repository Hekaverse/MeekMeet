import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ToastProvider } from '@/hooks/useToast'
import { useBackButton } from '@/hooks/useBackButton'
import { useNetwork } from '@/hooks/useNetwork'
import { useDeepLinks } from '@/hooks/useDeepLinks'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import BottomNav from '@/components/BottomNav'
import PageTransition from '@/components/PageTransition'
import HomeScreen from '@/screens/HomeScreen'
import ReadScreen from '@/screens/ReadScreen'
import ReaderScreen from '@/screens/ReaderScreen'
import CirclesScreen from '@/screens/CirclesScreen'
import CircleDetailScreen from '@/screens/CircleDetailScreen'
import DashboardScreen from '@/screens/DashboardScreen'
import SanctuaryScreen from '@/screens/SanctuaryScreen'
import LoginScreen from '@/screens/LoginScreen'
import { useToast } from '@/hooks/useToast'
import { getOnboarded } from '@/lib/preferences'
import { supabase } from '@/lib/supabase'

const BookmarksScreen = lazy(() => import('@/screens/BookmarksScreen'))
const SearchScreen = lazy(() => import('@/screens/SearchScreen'))
const GatheringDetailScreen = lazy(() => import('@/screens/GatheringDetailScreen'))
const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'))
const ShepherdDashboardScreen = lazy(() => import('@/screens/ShepherdDashboardScreen'))
const ShepherdManageScreen = lazy(() => import('@/screens/ShepherdManageScreen'))
const ShepherdApplyScreen = lazy(() => import('@/screens/ShepherdApplyScreen'))
const AdminApplicationsScreen = lazy(() => import('@/screens/AdminApplicationsScreen'))
const CompleteProfileScreen = lazy(() => import('@/screens/CompleteProfileScreen'))
const AdminDashboardScreen = lazy(() => import('@/screens/AdminDashboardScreen'))
const ContactAdminScreen = lazy(() => import('@/screens/ContactAdminScreen'))
const MeetingCreateScreen = lazy(() => import('@/screens/MeetingCreateScreen'))
const MeetingQuestionsScreen = lazy(() => import('@/screens/MeetingQuestionsScreen'))
const MeetingLiveScreen = lazy(() => import('@/screens/MeetingLiveScreen'))
const MeetingResponsesScreen = lazy(() => import('@/screens/MeetingResponsesScreen'))
const MeetingAnalyticsScreen = lazy(() => import('@/screens/MeetingAnalyticsScreen'))
const PrivacyScreen = lazy(() => import('@/screens/PrivacyScreen'))
const TermsScreen = lazy(() => import('@/screens/TermsScreen'))
const OnboardingScreen = lazy(() => import('@/screens/OnboardingScreen'))

function LazyWrap({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  )
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <>{children}</>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    const main = document.querySelector('main')
    if (main) main.scrollTop = 0
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <main className="flex-1 overflow-y-auto no-scrollbar safe-bottom pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

function NetworkListener() {
  const { isOnline, wasOffline } = useNetwork()
  const { showToast } = useToast()

  useEffect(() => {
    if (wasOffline && isOnline) {
      showToast('Back online', 'success')
    }
  }, [wasOffline, isOnline, showToast])

  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  useBackButton()
  useDeepLinks()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AuthGate><AppLayout><PageTransition><HomeScreen /></PageTransition></AppLayout></AuthGate>} />
        <Route path="/read" element={<AuthGate><AppLayout><PageTransition><ReadScreen /></PageTransition></AppLayout></AuthGate>} />
        <Route path="/read/:tradition" element={<AuthGate><AppLayout><PageTransition><ReaderScreen /></PageTransition></AppLayout></AuthGate>} />
        <Route path="/read/:tradition/:bookId/:chapter" element={<AuthGate><AppLayout><PageTransition><ReaderScreen /></PageTransition></AppLayout></AuthGate>} />
        <Route path="/circles" element={<AuthGate><AppLayout><PageTransition><CirclesScreen /></PageTransition></AppLayout></AuthGate>} />
        <Route path="/circles/:slug" element={<AuthGate><AppLayout><PageTransition><CircleDetailScreen /></PageTransition></AppLayout></AuthGate>} />
        <Route path="/dashboard" element={<AuthGate><AppLayout><PageTransition><DashboardScreen /></PageTransition></AppLayout></AuthGate>} />
        <Route path="/me" element={<AuthGate><AppLayout><PageTransition><SanctuaryScreen /></PageTransition></AppLayout></AuthGate>} />
        <Route path="/me/bookmarks" element={<AuthGate><AppLayout><PageTransition><LazyWrap><BookmarksScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/me/profile" element={<AuthGate><AppLayout><PageTransition><LazyWrap><ProfileScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd" element={<AuthGate><AppLayout><PageTransition><LazyWrap><ShepherdDashboardScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/:circleId/questions" element={<AuthGate><AppLayout><PageTransition><LazyWrap><ShepherdManageScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/:circleId/routine" element={<AuthGate><AppLayout><PageTransition><LazyWrap><ShepherdManageScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/:circleId/meetings" element={<AuthGate><AppLayout><PageTransition><LazyWrap><ShepherdManageScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/:circleId/settings" element={<AuthGate><AppLayout><PageTransition><LazyWrap><ShepherdManageScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/:circleId/members" element={<AuthGate><AppLayout><PageTransition><LazyWrap><ShepherdManageScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/apply" element={<AuthGate><AppLayout><PageTransition><LazyWrap><ShepherdApplyScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/:circleId/meetings/new" element={<AuthGate><AppLayout><PageTransition><LazyWrap><MeetingCreateScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/meetings/:meetingId/questions" element={<AuthGate><AppLayout><PageTransition><LazyWrap><MeetingQuestionsScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/meetings/:meetingId/live" element={<AuthGate><AppLayout><PageTransition><LazyWrap><MeetingLiveScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/meetings/:meetingId" element={<AuthGate><AppLayout><PageTransition><LazyWrap><MeetingLiveScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/meetings/:meetingId/responses" element={<AuthGate><AppLayout><PageTransition><LazyWrap><MeetingResponsesScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/shepherd/:circleId/analytics" element={<AuthGate><AppLayout><PageTransition><LazyWrap><MeetingAnalyticsScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/admin/applications" element={<AuthGate><AppLayout><PageTransition><LazyWrap><AdminApplicationsScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/admin/dashboard" element={<AuthGate><AppLayout><PageTransition><LazyWrap><AdminDashboardScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/contact-admin" element={<AuthGate><AppLayout><PageTransition><LazyWrap><ContactAdminScreen /></LazyWrap></PageTransition></AppLayout></AuthGate>} />
        <Route path="/gatherings/:id" element={<AuthGate><PageTransition><LazyWrap><GatheringDetailScreen /></LazyWrap></PageTransition></AuthGate>} />
        <Route path="/search" element={<AuthGate><PageTransition><LazyWrap><SearchScreen /></LazyWrap></PageTransition></AuthGate>} />
        <Route path="/privacy" element={<PageTransition><LazyWrap><PrivacyScreen /></LazyWrap></PageTransition>} />
        <Route path="/terms" element={<PageTransition><LazyWrap><TermsScreen /></LazyWrap></PageTransition>} />
        <Route path="/complete-profile" element={<AuthGate><PageTransition><LazyWrap><CompleteProfileScreen /></LazyWrap></PageTransition></AuthGate>} />
        <Route path="/login" element={<PageTransition><LoginScreen /></PageTransition>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    getOnboarded().then(setOnboarded)
  }, [])

  if (onboarded === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!onboarded) {
    return <LazyWrap><OnboardingScreen onComplete={() => setOnboarded(true)} /></LazyWrap>
  }

  return <>{children}</>
}

function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) {
      setProfileComplete(true)
      return
    }
    // Skip check on complete-profile page itself
    if (location.pathname === '/complete-profile') {
      setProfileComplete(true)
      return
    }
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
      .then(
        ({ data }: { data: { full_name: string | null } | null }) => {
          setProfileComplete(!!data?.full_name?.trim())
        },
        (err) => {
          // Network blip — don't trap user on complete-profile screen
          console.error('ProfileGate load error:', err)
          setProfileComplete(true)
        }
      )
  }, [user, location.pathname])

  if (isLoading || profileComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profileComplete) {
    return <Navigate to="/complete-profile" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <OnboardingGate>
              <ScrollToTop />
              <NetworkListener />
              <ProfileGate>
                <AnimatedRoutes />
              </ProfileGate>
            </OnboardingGate>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
