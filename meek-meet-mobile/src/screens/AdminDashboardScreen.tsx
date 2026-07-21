import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Shield,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  BookOpen,
  Crown,
  Loader2,
  ChevronRight,
  MessageSquare,
  TrendingUp,
  Mail,
  RefreshCw,
  Search,
  Inbox,
  AlertTriangle,

} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { revolutionaryQuestions, questionCategories } from '@/data/revolutionary-questions'

type AdminTab = 'overview' | 'applications' | 'shepherds' | 'circles' | 'meetings' | 'questions' | 'inbox'

interface AppStats {
  total_shepherds: number
  total_circles: number
  total_scheduled_meetings: number
  total_completed_meetings: number
  pending_applications: number
  total_members: number
  total_responses: number
  active_rsvps: number
}

interface Application {
  id: string
  full_name: string
  email: string | null
  location: string | null
  tradition: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user_id: string | null
}

interface ShepherdProfile {
  id: string
  full_name: string | null
  role: string
  created_at: string
  circles: { name: string; location: string }[]
}

interface Circle {
  id: string
  name: string
  location: string
  description: string | null
  is_active: boolean
  shepherd_count: number
}

interface Meeting {
  id: string
  circle_id: string
  circle_name: string
  scheduled_at: string
  status: string
  location_name: string | null
}

interface AdminMessage {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string
  message: string
  status: 'open' | 'resolved'
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
}

interface TabState {
  loading: boolean
  error: string | null
}

export default function AdminDashboardScreen() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [stats, setStats] = useState<AppStats | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [shepherds, setShepherds] = useState<ShepherdProfile[]>([])
  const [circles, setCircles] = useState<Circle[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [openMessageCount, setOpenMessageCount] = useState(0)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [tabState, setTabState] = useState<Record<AdminTab, TabState>>({
    overview: { loading: true, error: null },
    applications: { loading: false, error: null },
    shepherds: { loading: false, error: null },
    circles: { loading: false, error: null },
    meetings: { loading: false, error: null },
    questions: { loading: false, error: null },
    inbox: { loading: false, error: null },
  })
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject'; name: string } | null>(null)

  const setLoading = useCallback((tab: AdminTab, loading: boolean) => {
    setTabState((prev) => ({ ...prev, [tab]: { ...prev[tab], loading } }))
  }, [])

  const setError = useCallback((tab: AdminTab, error: string | null) => {
    setTabState((prev) => ({ ...prev, [tab]: { ...prev[tab], error } }))
  }, [])

  // ── Loaders ───────────────────────────────────────

  const loadOverview = useCallback(async () => {
    setLoading('overview', true)
    setError('overview', null)
    try {
      const { data, error } = await supabase.rpc('get_admin_stats')
      if (error) throw error
      // BigInt from Postgres count → Number/convert
      const safeStats: AppStats = {
        total_shepherds: Number(data?.total_shepherds ?? 0),
        total_circles: Number(data?.total_circles ?? 0),
        total_scheduled_meetings: Number(data?.total_scheduled_meetings ?? 0),
        total_completed_meetings: Number(data?.total_completed_meetings ?? 0),
        pending_applications: Number(data?.pending_applications ?? 0),
        total_members: Number(data?.total_members ?? 0),
        total_responses: Number(data?.total_responses ?? 0),
        active_rsvps: Number(data?.active_rsvps ?? 0),
      }
      setStats(safeStats)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load stats'
      setError('overview', msg)
    } finally {
      setLoading('overview', false)
    }
  }, [setLoading, setError])

  const loadApplications = useCallback(async () => {
    setLoading('applications', true)
    setError('applications', null)
    try {
      let q = supabase
        .from('shepherd_applications')
        .select('id, full_name, email, location, tradition, status, created_at, user_id')
        .order('created_at', { ascending: false })
      if (appFilter !== 'all') q = q.eq('status', appFilter)
      const { data, error } = await q
      if (error) throw error
      setApplications((data ?? []) as Application[])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load applications'
      setError('applications', msg)
    } finally {
      setLoading('applications', false)
    }
  }, [appFilter, setLoading, setError])

  const loadShepherds = useCallback(async () => {
    setLoading('shepherds', true)
    setError('shepherds', null)
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .in('role', ['shepherd', 'admin'])
        .order('created_at', { ascending: false })
      if (error) throw error
      if (!profiles) {
        setShepherds([])
        return
      }
      const enriched = await Promise.all(
        profiles.map(async (p) => {
          const { data: cs } = await supabase
            .from('circles')
            .select('name, location')
            .eq('shepherd_id', p.id)
          const circlesList = (cs ?? [])
            .filter((c): c is { name: string; location: string } => c != null)
          return { ...(p as unknown as Omit<ShepherdProfile, 'circles'>), circles: circlesList }
        })
      )
      setShepherds(enriched)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load shepherds'
      setError('shepherds', msg)
    } finally {
      setLoading('shepherds', false)
    }
  }, [setLoading, setError])

  const loadCircles = useCallback(async () => {
    setLoading('circles', true)
    setError('circles', null)
    try {
      const { data, error } = await supabase
        .from('circles')
        .select('id, name, location, description, is_active, shepherd_id')
        .order('name', { ascending: true })
      if (error) throw error
      if (data) {
        const enriched = data.map((c) => ({
          ...c,
          shepherd_count: c.shepherd_id ? 1 : 0,
        }))
        setCircles(enriched)
      } else {
        setCircles([])
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load circles'
      setError('circles', msg)
    } finally {
      setLoading('circles', false)
    }
  }, [setLoading, setError])

  const loadMeetings = useCallback(async () => {
    setLoading('meetings', true)
    setError('meetings', null)
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('id, circle_id, scheduled_at, status, location_name, circles(name)')
        .order('scheduled_at', { ascending: false })
        .limit(50)
      if (error) throw error
      const mapped: Meeting[] = (data ?? []).map((m) => {
        const related = (m as { circles?: { name?: string } | null }).circles
        const circleName = related?.name ?? 'Unknown'
        return {
          id: String((m as Record<string, unknown>).id),
          circle_id: String((m as Record<string, unknown>).circle_id),
          scheduled_at: String((m as Record<string, unknown>).scheduled_at),
          status: String((m as Record<string, unknown>).status || 'scheduled'),
          location_name: (m as Record<string, unknown>).location_name as string | null,
          circle_name: circleName,
        }
      })
      setMeetings(mapped)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load meetings'
      setError('meetings', msg)
    } finally {
      setLoading('meetings', false)
    }
  }, [setLoading, setError])

  const loadMessages = useCallback(async () => {
    setLoading('inbox', true)
    setError('inbox', null)
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('id, user_id, name, email, subject, message, status, created_at, resolved_at, resolved_by')
        .order('created_at', { ascending: false })
      if (error) throw error
      const msgs = (data ?? []) as AdminMessage[]
      setMessages(msgs)
      setOpenMessageCount(msgs.filter((m) => m.status === 'open').length)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load messages'
      setError('inbox', msg)
    } finally {
      setLoading('inbox', false)
    }
  }, [setLoading, setError])

  // ── Actions ───────────────────────────────────────

  const approveApp = async (app: Application) => {
    try {
      const { error } = await supabase.rpc('review_shepherd_application', { p_application_id: app.id, p_decision: 'approved' })
      if (error) throw error
      showToast('Application approved', 'success')
      loadApplications()
      loadOverview()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to approve', 'error')
    }
  }

  const rejectApp = async (id: string) => {
    try {
      const { error } = await supabase.rpc('review_shepherd_application', { p_application_id: id, p_decision: 'rejected' })
      if (error) throw error
      showToast('Application rejected', 'success')
      loadApplications()
      loadOverview()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to reject', 'error')
    }
  }

  const handleConfirm = () => {
    if (!confirmAction) return
    const app = applications.find((a) => a.id === confirmAction.id)
    if (!app) return
    if (confirmAction.action === 'approve') {
      approveApp(app)
    } else {
      rejectApp(confirmAction.id)
    }
    setConfirmAction(null)
  }

  const resolveMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: user?.id })
        .eq('id', id)
      if (error) throw error
      showToast('Message marked as resolved', 'success')
      loadMessages()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to resolve', 'error')
    }
  }

  // ── Effects ───────────────────────────────────────

  useEffect(() => {
    if (role !== 'admin') {
      setLoading('overview', false)
      return
    }
    loadOverview()
  }, [role, loadOverview, setLoading])

  useEffect(() => {
    if (role !== 'admin') return
    if (activeTab === 'applications') loadApplications()
    if (activeTab === 'shepherds') loadShepherds()
    if (activeTab === 'circles') loadCircles()
    if (activeTab === 'meetings') loadMeetings()
    if (activeTab === 'inbox') loadMessages()
    if (activeTab === 'questions') setLoading('questions', false)
    // Reset search + expanded message when switching tabs (except questions)
    if (activeTab !== 'questions') setSearchQuery('')
    setExpandedMessageId(null)
  }, [activeTab, appFilter, role, loadApplications, loadShepherds, loadCircles, loadMeetings, loadMessages, setLoading])

  // Realtime: pending application count
  useEffect(() => {
    if (role !== 'admin') return
    const channel = supabase
      .channel('admin-applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shepherd_applications' },
        () => {
          loadOverview()
          if (activeTab === 'applications') loadApplications()
        }
      )
      .subscribe()
    return () => {
      channel.unsubscribe()
    }
  }, [role, activeTab, loadOverview, loadApplications])

  // Realtime: admin messages
  useEffect(() => {
    if (role !== 'admin') return
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_messages' },
        () => {
          loadMessages()
        }
      )
      .subscribe()
    return () => {
      channel.unsubscribe()
    }
  }, [role, loadMessages])

  // ── Derived / filtered data ───────────────────────

  const filteredShepherds = useMemo(() => {
    if (!searchQuery.trim()) return shepherds
    const q = searchQuery.toLowerCase()
    return shepherds.filter(
      (s) =>
        (s.full_name ?? '').toLowerCase().includes(q) ||
        s.circles.some((c) => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q))
    )
  }, [shepherds, searchQuery])

  const filteredCircles = useMemo(() => {
    if (!searchQuery.trim()) return circles
    const q = searchQuery.toLowerCase()
    return circles.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
    )
  }, [circles, searchQuery])

  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings
    const q = searchQuery.toLowerCase()
    return meetings.filter(
      (m) =>
        m.circle_name.toLowerCase().includes(q) ||
        (m.location_name ?? '').toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q)
    )
  }, [meetings, searchQuery])

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    const q = searchQuery.toLowerCase()
    return messages.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    )
  }, [messages, searchQuery])

  // ── Render helpers ────────────────────────────────

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <Shield className="w-10 h-10 text-charcoal-muted/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-charcoal-muted">You do not have access to this page.</p>
        </div>
      </div>
    )
  }

  const tabs: { key: AdminTab; label: string; icon: typeof Shield; searchable?: boolean; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'applications', label: 'Applications', icon: Mail },
    { key: 'shepherds', label: 'Shepherds', icon: Crown, searchable: true },
    { key: 'circles', label: 'Circles', icon: MapPin, searchable: true },
    { key: 'meetings', label: 'Meetings', icon: Calendar, searchable: true },
    { key: 'inbox', label: 'Inbox', icon: Inbox, searchable: true, badge: openMessageCount },
    { key: 'questions', label: 'Questions', icon: BookOpen },
  ]

  const currentTabMeta = tabs.find((t) => t.key === activeTab)
  const isLoading = tabState[activeTab].loading
  const currentError = tabState[activeTab].error

  return (
    <div className="min-h-screen bg-cream pb-8">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 safe-top sticky top-0 z-10 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-xl text-charcoal">Admin Dashboard</h1>
            <p className="text-xs text-charcoal-muted">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'overview') loadOverview()
              else if (activeTab === 'applications') loadApplications()
              else if (activeTab === 'shepherds') loadShepherds()
              else if (activeTab === 'circles') loadCircles()
              else if (activeTab === 'meetings') loadMeetings()
              else if (activeTab === 'inbox') loadMessages()
            }}
            disabled={isLoading}
            className="p-2 -mr-2 disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-charcoal-muted ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-midnight text-cream'
                    : 'bg-cream-warm text-charcoal-muted border border-border-soft'
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-terracotta text-cream text-[10px] rounded-full min-w-[18px] text-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search bar (for searchable tabs) */}
        <AnimatePresence>
          {currentTabMeta?.searchable && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-9 pr-4 py-2.5 bg-cream-warm border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-midnight/20"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="px-5 pt-4">
        {/* Error state */}
        {currentError && (
          <div className="bg-terracotta-pale rounded-xl border border-terracotta/20 p-6 text-center mb-4">
            <AlertTriangle className="w-8 h-8 text-terracotta mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-terracotta font-medium mb-1">Something went wrong</p>
            <p className="text-xs text-charcoal-muted mb-3">{currentError}</p>
            <button
              onClick={() => {
                if (activeTab === 'overview') loadOverview()
                else if (activeTab === 'applications') loadApplications()
                else if (activeTab === 'shepherds') loadShepherds()
                else if (activeTab === 'circles') loadCircles()
                else if (activeTab === 'meetings') loadMeetings()
                else if (activeTab === 'inbox') loadMessages()
              }}
              className="px-4 py-2 bg-cream rounded-xl text-xs font-medium text-charcoal border border-border-soft active:scale-95 transition-transform"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !currentError && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-charcoal-muted animate-spin" strokeWidth={1.5} />
          </div>
        )}

        {/* Tab content */}
        {!isLoading && !currentError && (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard icon={<Crown className="w-4 h-4 text-terracotta" strokeWidth={1.5} />} label="Shepherds" value={String(stats.total_shepherds)} />
                      <StatCard icon={<MapPin className="w-4 h-4 text-sage" strokeWidth={1.5} />} label="Circles" value={String(stats.total_circles)} />
                      <StatCard icon={<Calendar className="w-4 h-4 text-wheat-dark" strokeWidth={1.5} />} label="Scheduled" value={String(stats.total_scheduled_meetings)} />
                      <StatCard icon={<CheckCircle className="w-4 h-4 text-midnight" strokeWidth={1.5} />} label="Completed" value={String(stats.total_completed_meetings)} />
                      <StatCard icon={<Mail className="w-4 h-4 text-terracotta" strokeWidth={1.5} />} label="Pending Apps" value={String(stats.pending_applications)} />
                      <StatCard icon={<Users className="w-4 h-4 text-sage" strokeWidth={1.5} />} label="Members" value={String(stats.total_members)} />
                      <StatCard icon={<MessageSquare className="w-4 h-4 text-wheat-dark" strokeWidth={1.5} />} label="Responses" value={String(stats.total_responses)} />
                      <StatCard icon={<TrendingUp className="w-4 h-4 text-midnight" strokeWidth={1.5} />} label="RSVPs" value={String(stats.active_rsvps)} />
                    </div>

                    <div className="bg-cream-warm rounded-xl border border-border-soft p-4">
                      <h3 className="text-sm font-medium text-charcoal mb-3">Quick Links</h3>
                      <div className="space-y-2">
                        <QuickLink label="Review Applications" count={stats.pending_applications} onClick={() => setActiveTab('applications')} />
                        <QuickLink label="View All Shepherds" onClick={() => setActiveTab('shepherds')} />
                        <QuickLink label="View All Circles" onClick={() => setActiveTab('circles')} />
                        <QuickLink label="View All Meetings" onClick={() => setActiveTab('meetings')} />
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState icon={<TrendingUp className="w-10 h-10" strokeWidth={1.5} />} title="No stats available" action={{ label: 'Retry', onClick: loadOverview }} />
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setAppFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        appFilter === f ? 'bg-midnight text-cream' : 'bg-cream-warm text-charcoal-muted border border-border-soft'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                {applications.length === 0 ? (
                  <EmptyState
                    icon={<Inbox className="w-10 h-10" strokeWidth={1.5} />}
                    title={`No ${appFilter} applications`}
                    subtitle={appFilter === 'pending' ? 'Check back later for new shepherd applications.' : 'Try a different filter.'}
                    action={appFilter !== 'all' ? { label: 'View All', onClick: () => setAppFilter('all') } : undefined}
                  />
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div key={app.id} className="bg-cream-warm rounded-xl border border-border-soft p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            app.status === 'pending' ? 'bg-wheat-pale text-wheat-dark' :
                            app.status === 'approved' ? 'bg-sage-pale text-sage-dark' :
                            'bg-terracotta-pale text-terracotta'
                          }`}>{app.status}</span>
                          <span className="text-[10px] text-charcoal-muted">{new Date(app.created_at).toLocaleDateString('en-AU')}</span>
                        </div>
                        <p className="text-sm font-medium text-charcoal">{app.full_name}</p>
                        <p className="text-xs text-charcoal-muted">{app.email}</p>
                        <p className="text-xs text-charcoal-muted">{app.location || '—'} · {app.tradition || '—'}</p>
                        {app.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => setConfirmAction({ id: app.id, action: 'approve', name: app.full_name })}
                              className="flex-1 py-2 bg-sage text-cream rounded-xl text-xs font-medium active:scale-95 transition-transform"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: app.id, action: 'reject', name: app.full_name })}
                              className="flex-1 py-2 bg-terracotta-pale text-terracotta rounded-xl text-xs font-medium active:scale-95 transition-transform"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shepherds' && (
              <div className="space-y-3">
                {filteredShepherds.length === 0 ? (
                  <EmptyState
                    icon={<Crown className="w-10 h-10" strokeWidth={1.5} />}
                    title={searchQuery ? 'No shepherds match your search' : 'No shepherds found'}
                    subtitle={searchQuery ? 'Try a different search term.' : 'Approved shepherd applications will appear here.'}
                    action={searchQuery ? { label: 'Clear Search', onClick: () => setSearchQuery('') } : undefined}
                  />
                ) : (
                  filteredShepherds.map((s) => (
                    <div key={s.id} className="bg-cream-warm rounded-xl border border-border-soft p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-midnight flex items-center justify-center">
                          <span className="text-sm text-cream font-serif">{(s.full_name || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-charcoal">{s.full_name || 'Unknown'}</p>
                          <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${s.role === 'admin' ? 'bg-terracotta-pale text-terracotta' : 'bg-sage-pale text-sage'}`}>
                            {s.role}
                          </span>
                        </div>
                      </div>
                      {s.circles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {s.circles.map((c, i) => (
                            <p key={i} className="text-xs text-charcoal-muted flex items-center gap-1">
                              <MapPin className="w-3 h-3" strokeWidth={1.5} />
                              {c.name} · {c.location}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'circles' && (
              <div className="space-y-3">
                {filteredCircles.length === 0 ? (
                  <EmptyState
                    icon={<MapPin className="w-10 h-10" strokeWidth={1.5} />}
                    title={searchQuery ? 'No circles match your search' : 'No circles found'}
                    subtitle={searchQuery ? 'Try a different search term.' : 'Circles created by shepherds will appear here.'}
                    action={searchQuery ? { label: 'Clear Search', onClick: () => setSearchQuery('') } : undefined}
                  />
                ) : (
                  filteredCircles.map((c) => (
                    <div key={c.id} className="bg-cream-warm rounded-xl border border-border-soft p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-charcoal">{c.name}</p>
                          <p className="text-xs text-charcoal-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" strokeWidth={1.5} />
                            {c.location}
                          </p>
                          {c.description && <p className="text-xs text-charcoal-muted mt-1 italic">{c.description}</p>}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${c.is_active ? 'bg-sage-pale text-sage' : 'bg-charcoal-muted/10 text-charcoal-muted'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-charcoal-muted">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" strokeWidth={1.5} />
                          {c.shepherd_count} shepherd{c.shepherd_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'meetings' && (
              <div className="space-y-3">
                {filteredMeetings.length === 0 ? (
                  <EmptyState
                    icon={<Calendar className="w-10 h-10" strokeWidth={1.5} />}
                    title={searchQuery ? 'No meetings match your search' : 'No meetings found'}
                    subtitle={searchQuery ? 'Try a different search term.' : 'Scheduled meetings will appear here.'}
                    action={searchQuery ? { label: 'Clear Search', onClick: () => setSearchQuery('') } : undefined}
                  />
                ) : (
                  filteredMeetings.map((m) => (
                    <div key={m.id} className="bg-cream-warm rounded-xl border border-border-soft p-4">
                      <p className="text-sm font-medium text-charcoal">{m.circle_name}</p>
                      <p className="text-xs text-charcoal-muted mt-0.5">
                        {new Date(m.scheduled_at).toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
                          m.status === 'live' ? 'bg-terracotta-pale text-terracotta' :
                          m.status === 'completed' ? 'bg-sage-pale text-sage' :
                          m.status === 'cancelled' ? 'bg-charcoal-muted/10 text-charcoal-muted' :
                          'bg-wheat-pale text-wheat-dark'
                        }`}>
                          {m.status}
                        </span>
                        {m.location_name && (
                          <span className="text-[10px] text-charcoal-muted flex items-center gap-1">
                            <MapPin className="w-3 h-3" strokeWidth={1.5} />
                            {m.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'inbox' && (
              <div className="space-y-3">
                {filteredMessages.length === 0 ? (
                  <EmptyState
                    icon={<Inbox className="w-10 h-10" strokeWidth={1.5} />}
                    title={searchQuery ? 'No messages match your search' : 'No messages'}
                    subtitle={searchQuery ? 'Try a different search term.' : 'Member messages will appear here.'}
                    action={searchQuery ? { label: 'Clear Search', onClick: () => setSearchQuery('') } : undefined}
                  />
                ) : (
                  filteredMessages.map((msg) => {
                    const isExpanded = expandedMessageId === msg.id
                    return (
                      <div key={msg.id} className="bg-cream-warm rounded-xl border border-border-soft overflow-hidden">
                        <button
                          onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                          className="w-full p-4 text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-charcoal truncate">{msg.subject}</p>
                              <p className="text-xs text-charcoal-muted mt-0.5">
                                {msg.name} · {msg.email}
                              </p>
                            </div>
                            <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${
                              msg.status === 'open' ? 'bg-wheat-pale text-wheat-dark' : 'bg-sage-pale text-sage-dark'
                            }`}>
                              {msg.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-charcoal-muted/60 mt-1">
                            {new Date(msg.created_at).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 border-t border-border-soft">
                                <p className="text-sm text-charcoal whitespace-pre-wrap">{msg.message}</p>
                                {msg.status === 'open' && (
                                  <button
                                    onClick={() => resolveMessage(msg.id)}
                                    className="mt-3 px-4 py-2 bg-sage text-cream rounded-xl text-xs font-medium active:scale-95 transition-transform"
                                  >
                                    Mark Resolved
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-3">
                <div className="bg-cream-warm rounded-xl border border-border-soft p-4">
                  <p className="text-sm font-medium text-charcoal">Universal Question Pool</p>
                  <p className="text-xs text-charcoal-muted mt-1">{revolutionaryQuestions.length} questions across {questionCategories.length} categories</p>
                </div>
                {questionCategories.map((category) => {
                  const qs = revolutionaryQuestions.filter((q) => q.category === category)
                  return (
                    <div key={category} className="bg-cream-warm rounded-xl border border-border-soft overflow-hidden">
                      <div className="px-4 py-3 border-b border-border-soft">
                        <span className="text-sm font-medium text-midnight">{category}</span>
                        <span className="text-xs text-charcoal-muted ml-2">{qs.length} questions</span>
                      </div>
                      <div className="px-4 py-2 space-y-2">
                        {qs.map((q) => (
                          <div key={q.id} className="py-2 border-b border-border-soft last:border-0">
                            <p className="text-sm text-charcoal">{q.question}</p>
                            <p className="text-[10px] text-charcoal-muted/60 mt-0.5">{q.context}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-cream rounded-2xl p-5 border border-border-soft shadow-xl"
            >
              <h3 className="font-medium text-midnight mb-2">
                {confirmAction.action === 'approve' ? 'Approve Application?' : 'Reject Application?'}
              </h3>
              <p className="text-sm text-charcoal-muted mb-4">
                {confirmAction.action === 'approve'
                  ? `This will approve ${confirmAction.name} as a shepherd. Their profile role will be updated.`
                  : `This will reject ${confirmAction.name}'s shepherd application. This cannot be undone.`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm border border-border-soft text-charcoal-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
                    confirmAction.action === 'approve'
                      ? 'bg-sage text-cream'
                      : 'bg-terracotta text-cream'
                  }`}
                >
                  {confirmAction.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-cream-warm rounded-xl border border-border-soft p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-charcoal-muted font-medium">{label}</span>
      </div>
      <p className="text-xl font-serif text-charcoal">{value}</p>
    </div>
  )
}

function QuickLink({ label, count, onClick }: { label: string; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-2.5 px-3 bg-cream rounded-xl border border-border-soft active:scale-[0.98] transition-transform"
    >
      <span className="text-sm text-charcoal">{label}</span>
      <div className="flex items-center gap-1">
        {count !== undefined && count > 0 && (
          <span className="text-xs text-terracotta font-medium">{count}</span>
        )}
        <ChevronRight className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
      </div>
    </button>
  )
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="py-16 text-center">
      <div className="text-charcoal-muted/40 mx-auto mb-3">{icon}</div>
      <p className="text-sm font-medium text-charcoal-muted">{title}</p>
      {subtitle && <p className="text-xs text-charcoal-muted/70 mt-1">{subtitle}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-cream-warm border border-border-soft rounded-xl text-xs font-medium text-charcoal active:scale-95 transition-transform"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
