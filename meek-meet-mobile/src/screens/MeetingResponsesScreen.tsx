import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Share2,
  Copy,
  Users,
  Mail,
  Phone,
  Video,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { hapticSelect, hapticSuccess } from '@/lib/haptics'
import { useToast } from '@/hooks/useToast'
import { extractThemes, calculateThreshold } from '@/lib/theme-extraction'

interface ResponseRow {
  id: string
  question_id: string
  content: string
  user_id: string
  created_at: string
}

interface QuestionRow {
  id: string
  question_id: string
  content: string
  category: string
  order_index: number
}

interface MeetingHeader {
  meeting_type?: 'in_person' | 'digital' | 'hybrid'
  join_url?: string | null
  location_name?: string | null
}

interface AttendeeRow {
  user_id: string
  status: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  phone: string | null
  denomination: string | null
}

export default function MeetingResponsesScreen() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [responses, setResponses] = useState<ResponseRow[]>([])
  const [attendees, setAttendees] = useState<AttendeeRow[]>([])
  const [meetingInfo, setMeetingInfo] = useState<MeetingHeader | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!meetingId) return
    async function load() {
      const [{ data: q }, { data: r }, { data: rsvps }, { data: minfo }] = await Promise.all([
        supabase.from('meeting_questions').select('*').eq('meeting_id', meetingId).order('order_index', { ascending: true }),
        supabase.from('responses').select('*').eq('meeting_id', meetingId),
        supabase.from('rsvps').select(`
          user_id,
          status,
          profile:profiles(full_name, avatar_url, phone, denomination)
        `).eq('meeting_id', meetingId).eq('status', 'going'),
        supabase.from('meetings').select('meeting_type, join_url, location_name').eq('id', meetingId).single(),
      ])
      const enrichedAttendees = ((rsvps ?? []) as any[]).map((r) => {
        const profile = r.profile as Record<string, string | null> | null
        return {
          user_id: r.user_id as string,
          status: r.status as string,
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
          avatar_url: profile?.avatar_url ?? null,
          phone: profile?.phone ?? null,
          denomination: profile?.denomination ?? null,
        }
      })
      setQuestions(q ?? [])
      setResponses(r ?? [])
      setAttendees(enrichedAttendees)
      setMeetingInfo(minfo ?? null)
      setLoading(false)
    }
    load()
  }, [meetingId])

  const handleCopySummary = () => {
    hapticSelect()
    const lines: string[] = []
    lines.push('Meek Meet — Response Summary')
    lines.push('')
    for (const q of questions) {
      const qs = responses.filter((r) => r.question_id === q.question_id)
      lines.push(`Q${q.order_index + 1}: ${q.content}`)
      lines.push(`  ${qs.length} response${qs.length !== 1 ? 's' : ''}`)
      const themes = extractThemes(qs.map((r) => r.content))
      if (themes.topWords.length > 0) {
        lines.push(`  Themes: ${themes.topWords.slice(0, 5).map((w) => w.word).join(', ')}`)
      }
      lines.push('')
    }
    navigator.clipboard.writeText(lines.join('\n'))
    hapticSuccess()
    showToast('Summary copied to clipboard', 'success')
  }

  const handleShare = async () => {
    hapticSelect()
    const lines: string[] = []
    for (const q of questions) {
      const qs = responses.filter((r) => r.question_id === q.question_id)
      lines.push(`Q${q.order_index + 1}: ${qs.length} responses`)
    }
    const text = `Meek Meet Response Summary\n\n${lines.join('\n')}`
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title: 'Response Summary', text })
    } catch {
      // cancelled
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const goingCount = attendees.length
  const totalResponses = responses.length
  const overallThreshold = calculateThreshold(totalResponses, goingCount)

  return (
    <div className="min-h-screen bg-cream safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm border-b border-border-soft px-5 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { hapticSelect(); navigate(-1) }}
            className="p-2 -ml-2 active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-midnight" strokeWidth={1.5} />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-lg text-midnight">Responses</h1>
            <p className="text-xs text-charcoal-muted">
              {totalResponses} response{totalResponses !== 1 ? 's' : ''} · {goingCount} attending
            </p>
            {meetingInfo?.meeting_type && (
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  meetingInfo.meeting_type === 'digital' ? 'bg-sky-pale text-sky-soft' :
                  meetingInfo.meeting_type === 'hybrid' ? 'bg-wheat-pale text-wheat-dark' :
                  'bg-sage-pale text-sage-dark'
                }`}>
                  {meetingInfo.meeting_type === 'in_person' ? 'In Person' : meetingInfo.meeting_type === 'digital' ? 'Digital' : 'Hybrid'}
                </span>
                {meetingInfo.join_url && (
                  <button
                    onClick={() => window.open(meetingInfo.join_url!, '_blank')}
                    className="text-[10px] text-sky-soft flex items-center gap-0.5"
                  >
                    <Video className="w-2.5 h-2.5" strokeWidth={1.5} />
                    Join Link
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="p-2 active:scale-90 transition-transform"
              title="Copy summary"
            >
              <Copy className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 active:scale-90 transition-transform"
              title="Share summary"
            >
              <Share2 className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5 pb-8">
        {/* Overall threshold */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream-warm rounded-2xl border border-border-soft p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
              <span className="text-sm font-medium text-midnight">Response Rate</span>
            </div>
            <span className={`text-sm font-medium ${overallThreshold.reached ? 'text-sage' : 'text-terracotta'}`}>
              {overallThreshold.percentage}%
            </span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallThreshold.percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${overallThreshold.reached ? 'bg-sage' : 'bg-terracotta'}`}
            />
          </div>
          <p className="text-xs text-charcoal-muted mt-2">
            {overallThreshold.reached
              ? 'Threshold reached. Patterns are becoming clear.'
              : 'Collecting more responses for meaningful patterns.'}
          </p>
        </motion.div>

        {/* Attendee list */}
        {attendees.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cream-warm rounded-2xl border border-border-soft p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-sage" strokeWidth={1.5} />
              <span className="text-sm font-medium text-midnight">
                Attendees ({attendees.length})
              </span>
            </div>
            <div className="space-y-2">
              {attendees.map((a) => (
                <div key={a.user_id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-sage-pale flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-medium text-sage">
                        {(a.full_name ?? a.email ?? '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-charcoal truncate">
                      {a.full_name || 'Unnamed Member'}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.email && (
                        <span className="text-[10px] text-charcoal-muted flex items-center gap-0.5">
                          <Mail className="w-2.5 h-2.5" strokeWidth={1.5} />
                          {a.email}
                        </span>
                      )}
                      {a.phone && (
                        <span className="text-[10px] text-charcoal-muted flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" strokeWidth={1.5} />
                          {a.phone}
                        </span>
                      )}
                      {a.denomination && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-wheat-pale text-wheat-dark rounded-full font-medium">
                          {a.denomination}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Per-question breakdown */}
        {questions.map((q, i) => {
          const qs = responses.filter((r) => r.question_id === q.question_id)
          const threshold = calculateThreshold(qs.length, goingCount)
          const themes = extractThemes(qs.map((r) => r.content))

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-cream-warm rounded-2xl border border-border-soft overflow-hidden"
            >
              {/* Question header */}
              <div className="p-5 border-b border-border-soft">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-terracotta text-cream flex items-center justify-center text-[10px] font-medium">
                    {i + 1}
                  </span>
                  <span className="text-xs text-charcoal-muted uppercase tracking-wider">
                    {q.category}
                  </span>
                  <span className={`text-xs font-medium ml-auto ${threshold.reached ? 'text-sage' : 'text-terracotta'}`}>
                    {qs.length}/{goingCount}
                  </span>
                </div>
                <p className="text-base text-charcoal leading-relaxed">{q.content}</p>

                {/* Threshold bar */}
                <div className="mt-3 h-1.5 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${threshold.reached ? 'bg-sage' : 'bg-terracotta'}`}
                    style={{ width: `${threshold.percentage}%` }}
                  />
                </div>
              </div>

              {/* Themes */}
              {themes.topWords.length > 0 && (
                <div className="px-5 py-3 border-b border-border-soft bg-white/40">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BarChart3 className="w-3.5 h-3.5 text-charcoal-muted" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium text-charcoal-muted uppercase tracking-wider">
                      Themes
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {themes.topWords.slice(0, 6).map((w) => (
                      <span
                        key={w.word}
                        className="px-2.5 py-1 bg-wheat-pale text-wheat-dark text-[11px] font-medium rounded-full"
                      >
                        {w.word} ({w.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Responses */}
              <div className="divide-y divide-border-soft">
                {qs.map((r) => (
                  <div key={r.id} className="px-5 py-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <p className="text-sm text-charcoal leading-relaxed">{r.content}</p>
                    </div>
                  </div>
                ))}
                {qs.length === 0 && (
                  <div className="px-5 py-6 text-center">
                    <MessageSquare className="w-6 h-6 text-charcoal-muted mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-charcoal-muted">No responses yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
