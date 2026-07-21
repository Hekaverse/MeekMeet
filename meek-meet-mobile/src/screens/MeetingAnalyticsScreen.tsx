import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  Users,
  MessageSquare,
  CheckCircle2,
  CircleDot,
  TrendingUp,
  Calendar,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { extractThemes } from '@/lib/theme-extraction'
import type { Meeting } from '@/types'

interface ResponseRow {
  id: string
  meeting_id: string
  question_id: string
  user_id: string
  content: string
  created_at: string
  meeting?: { scheduled_at: string }
}

interface ActionItem {
  id: string
  circle_id: string
  description: string
  owner_id: string | null
  status: 'open' | 'completed'
  due_date: string | null
  created_at: string
  owner?: { full_name: string | null }
}

interface AnalyticsData {
  meetings: Meeting[]
  responses: ResponseRow[]
  actions: ActionItem[]
  memberCount: number
}

export default function MeetingAnalyticsScreen() {
  const { circleId } = useParams<{ circleId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isShepherd, setIsShepherd] = useState(false)
  const [newAction, setNewAction] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!circleId) return
    loadData()
    checkShepherd()
  }, [circleId])

  const checkShepherd = async () => {
    if (!user || !circleId) return
    const { data } = await supabase
      .from('circle_shepherds')
      .select('id')
      .eq('circle_id', circleId)
      .eq('user_id', user.id)
      .maybeSingle()
    setIsShepherd(!!data)
  }

  const loadData = async () => {
    if (!circleId) return
    setLoading(true)

    const [meetingsRes, responsesRes, actionsRes] = await Promise.all([
      supabase
        .from('meetings')
        .select('*')
        .eq('circle_id', circleId)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false })
        .limit(20),
      supabase
        .from('responses')
        .select(`
          id, meeting_id, question_id, user_id, content, created_at,
          meeting:meetings(scheduled_at)
        `)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('circle_actions')
        .select(`
          id, circle_id, description, owner_id, status, due_date, created_at,
          owner:profiles(full_name)
        `)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false }),
    ])

    const meetings = (meetingsRes.data ?? []) as Meeting[]
    const meetingIds = meetings.map((m) => m.id)

    let memberCount = 1
    if (meetingIds.length > 0) {
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('user_id')
        .in('meeting_id', meetingIds)
        .limit(1000)
      memberCount = Math.max(new Set((rsvpData ?? []).map((r) => r.user_id)).size, 1)
    }

    setData({
      meetings,
      responses: (responsesRes.data ?? []) as unknown as ResponseRow[],
      actions: (actionsRes.data ?? []) as unknown as ActionItem[],
      memberCount,
    })
    setLoading(false)
  }

  const addAction = async () => {
    if (!newAction.trim() || !circleId || !isShepherd) return
    setAdding(true)
    const { error } = await supabase
      .from('circle_actions')
      .insert({
        circle_id: circleId,
        description: newAction.trim(),
        owner_id: user?.id ?? null,
        status: 'open',
      })
    if (!error) {
      showToast('Action item created', 'success')
      setNewAction('')
      await loadData()
    } else {
      showToast('Could not create action', 'error')
    }
    setAdding(false)
  }

  const toggleAction = async (id: string, current: 'open' | 'completed') => {
    const next = current === 'open' ? 'completed' : 'open'
    const { error } = await supabase
      .from('circle_actions')
      .update({ status: next })
      .eq('id', id)
    if (!error) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              actions: prev.actions.map((a) =>
                a.id === id ? { ...a, status: next } : a
              ),
            }
          : null
      )
    }
  }

  const deleteAction = async (id: string) => {
    const { error } = await supabase.from('circle_actions').delete().eq('id', id)
    if (!error) {
      setData((prev) =>
        prev
          ? { ...prev, actions: prev.actions.filter((a) => a.id !== id) }
          : null
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-6">
        <p className="text-charcoal-muted">Could not load analytics.</p>
      </div>
    )
  }

  const { meetings, responses, actions, memberCount } = data

  // ── Derived metrics ────────────────────────────────

  const totalMeetings = meetings.length
  const totalResponses = responses.length
  const uniqueResponders = new Set(responses.map((r) => r.user_id)).size
  const avgResponseRate =
    totalMeetings > 0 && memberCount > 0
      ? Math.round((totalResponses / (totalMeetings * memberCount)) * 100)
      : 0

  // Extract themes from all responses
  const allTexts = responses.map((r) => r.content)
  const themes = extractThemes(allTexts)

  // Responses per meeting trend
  const responsesByMeeting: Record<string, number> = {}
  responses.forEach((r) => {
    responsesByMeeting[r.meeting_id] = (responsesByMeeting[r.meeting_id] ?? 0) + 1
  })

  const meetingTrends = meetings
    .slice(0, 6)
    .reverse()
    .map((m) => ({
      date: new Date(m.scheduled_at).toLocaleDateString('en-AU', {
        month: 'short',
        day: 'numeric',
      }),
      count: responsesByMeeting[m.id] ?? 0,
    }))

  const maxTrend = Math.max(...meetingTrends.map((t) => t.count), 1)

  // Member leaderboard
  const memberResponses: Record<string, number> = {}
  responses.forEach((r) => {
    memberResponses[r.user_id] = (memberResponses[r.user_id] ?? 0) + 1
  })
  const topMembers = Object.entries(memberResponses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const openActions = actions.filter((a) => a.status === 'open')
  const completedActions = actions.filter((a) => a.status === 'completed')

  return (
    <div className="min-h-screen bg-cream pb-8">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 safe-top sticky top-0 z-10 bg-cream/95 backdrop-blur-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 mb-1">
          <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-xl text-charcoal">Circle Analytics</h1>
        <p className="text-xs text-charcoal-muted mt-0.5">
          Insights across {totalMeetings} completed meets
        </p>
      </div>

      <div className="px-5 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            icon={<Calendar className="w-4 h-4 text-sage" strokeWidth={1.5} />}
            label="Meets"
            value={String(totalMeetings)}
          />
          <SummaryCard
            icon={<MessageSquare className="w-4 h-4 text-terracotta" strokeWidth={1.5} />}
            label="Responses"
            value={String(totalResponses)}
          />
          <SummaryCard
            icon={<Users className="w-4 h-4 text-midnight" strokeWidth={1.5} />}
            label="Contributors"
            value={String(uniqueResponders)}
          />
          <SummaryCard
            icon={<TrendingUp className="w-4 h-4 text-wheat-dark" strokeWidth={1.5} />}
            label="Avg Response Rate"
            value={`${avgResponseRate}%`}
          />
        </div>

        {/* Response trend */}
        {meetingTrends.length > 0 && (
          <Section title="Response Trend" icon={<BarChart3 className="w-4 h-4" strokeWidth={1.5} />}>
            <div className="flex items-end gap-2 h-24 pt-2">
              {meetingTrends.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-sage/30 rounded-t-lg transition-all"
                    style={{ height: `${(t.count / maxTrend) * 100}%` }}
                  />
                  <span className="text-[10px] text-charcoal-muted">{t.date}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Top themes */}
        {themes.topWords.length > 0 && (
          <Section title="Recurring Themes" icon={<CircleDot className="w-4 h-4" strokeWidth={1.5} />}>
            <div className="flex flex-wrap gap-2">
              {themes.topWords.map(({ word, count }) => (
                <span
                  key={word}
                  className="px-2.5 py-1 bg-wheat-pale text-wheat-dark rounded-full text-xs font-medium"
                >
                  {word} ({count})
                </span>
              ))}
            </div>
            <p className="text-[10px] text-charcoal-muted mt-2">
              {themes.totalWords} words across {allTexts.length} responses
            </p>
          </Section>
        )}

        {/* Top contributors */}
        {topMembers.length > 0 && (
          <Section title="Top Contributors" icon={<Users className="w-4 h-4" strokeWidth={1.5} />}>
            <div className="space-y-2">
              {topMembers.map(([userId, count], i) => (
                <div key={userId} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-cream-warm flex items-center justify-center text-[10px] font-medium text-charcoal-muted">
                    {i + 1}
                  </span>
                  <div className="flex-1 h-1.5 bg-cream-warm rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / topMembers[0][1]) * 100}%` }}
                      className="h-full bg-sage rounded-full"
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-charcoal-muted w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Action Items */}
        <Section title="Action Items" icon={<CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />}>
          {isShepherd && (
            <div className="flex gap-2 mb-3">
              <input
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAction()}
                placeholder="Create an action from recurring themes..."
                className="flex-1 px-3 py-2 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
              <button
                onClick={addAction}
                disabled={adding || !newAction.trim()}
                className="px-3 py-2 bg-midnight text-cream rounded-xl text-sm active:scale-95 transition-transform disabled:opacity-50"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <Plus className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {openActions.map((a) => (
              <ActionRow
                key={a.id}
                action={a}
                isShepherd={isShepherd}
                onToggle={() => toggleAction(a.id, a.status)}
                onDelete={() => deleteAction(a.id)}
              />
            ))}
            {completedActions.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-wider text-charcoal-muted font-medium pt-1">
                  Completed
                </p>
                {completedActions.map((a) => (
                  <ActionRow
                    key={a.id}
                    action={a}
                    isShepherd={isShepherd}
                    onToggle={() => toggleAction(a.id, a.status)}
                    onDelete={() => deleteAction(a.id)}
                  />
                ))}
              </>
            )}
            {actions.length === 0 && (
              <p className="text-xs text-charcoal-muted text-center py-2">
                No action items yet. Create one from a recurring theme.
              </p>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-cream-warm rounded-xl border border-border-soft p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-charcoal-muted font-medium">
          {label}
        </span>
      </div>
      <p className="text-xl font-serif text-charcoal">{value}</p>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-cream-warm rounded-xl border border-border-soft p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-charcoal-muted">{icon}</span>
        <h3 className="text-sm font-medium text-charcoal">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function ActionRow({
  action,
  isShepherd,
  onToggle,
  onDelete,
}: {
  action: ActionItem
  isShepherd: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-start gap-2.5 bg-cream rounded-xl border border-border-soft p-3">
      <button
        onClick={onToggle}
        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
          action.status === 'completed'
            ? 'bg-sage border-sage'
            : 'border-charcoal-muted'
        }`}
      >
        {action.status === 'completed' && (
          <CheckCircle2 className="w-3 h-3 text-cream" strokeWidth={2} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            action.status === 'completed'
              ? 'text-charcoal-muted line-through'
              : 'text-charcoal'
          }`}
        >
          {action.description}
        </p>
        {action.owner?.full_name && (
          <p className="text-[10px] text-charcoal-muted mt-0.5">
            {action.owner.full_name}
          </p>
        )}
      </div>
      {isShepherd && (
        <button
          onClick={onDelete}
          className="p-1 text-charcoal-muted hover:text-terracotta flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}
