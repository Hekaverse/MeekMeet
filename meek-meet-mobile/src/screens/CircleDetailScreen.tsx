import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Calendar, CheckCircle, XCircle, HelpCircle, Clock, User, Users, BarChart3, BookOpen, Pencil, Video, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { hapticSelect, hapticSuccess } from '@/lib/haptics'
import { useToast } from '@/hooks/useToast'
import { cancelMeetingNotifications } from '@/lib/notifications'
import type { Circle, Meeting } from '@/types'

interface Question {
  id: string
  content: string
  order_index: number
}

interface Routine {
  id: string
  title: string
  description: string | null
  duration_minutes: number | null
  order_index: number
}

interface ShepherdProfile {
  full_name: string | null
}

export default function CircleDetailScreen() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [circle, setCircle] = useState<Circle | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [shepherd, setShepherd] = useState<ShepherdProfile | null>(null)
  const [rsvps, setRsvps] = useState<Record<string, string>>({})
  const [unlockedMeetings, setUnlockedMeetings] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [isShepherd, setIsShepherd] = useState(false)

  useEffect(() => {
    if (!user || !circle) {
      setIsShepherd(false)
      return
    }
    if (user.id === circle.shepherd_id) {
      setIsShepherd(true)
      return
    }
    supabase
      .from('circle_shepherds')
      .select('id')
      .eq('circle_id', circle.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setIsShepherd(!!data))
  }, [user, circle])

  useEffect(() => {
    if (!slug) return

    Promise.all([
      supabase.from('circles').select('*').eq('slug', slug).eq('is_active', true).single(),
      supabase
        .from('meetings')
        .select('*')
        .neq('status', 'cancelled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10),
    ])
      .then(([{ data: c }, { data: m }]) => {
        setCircle(c)
        if (c && m) {
          const filtered = m.filter((mt) => mt.circle_id === c.id)
          setMeetings(filtered)

          // Load unlocked questions for members
          if (filtered.length > 0 && user) {
            supabase
              .from('meeting_questions')
              .select('meeting_id, unlocked_at')
              .in('meeting_id', filtered.map((mt) => mt.id))
              .then(({ data: mq }) => {
                if (mq) {
                  const unlocked = new Set<string>()
                  for (const q of mq) {
                    if (q.unlocked_at && new Date(q.unlocked_at) <= new Date()) {
                      unlocked.add(q.meeting_id)
                    }
                  }
                  setUnlockedMeetings(unlocked)
                }
              })
          }

          Promise.all([
            supabase.from('profiles').select('full_name').eq('id', c.shepherd_id).single(),
            supabase.from('circle_questions').select('*').eq('circle_id', c.id).eq('is_active', true).order('order_index', { ascending: true }),
            supabase.from('circle_routines').select('*').eq('circle_id', c.id).order('order_index', { ascending: true }),
          ])
            .then(([{ data: prof }, { data: q }, { data: r }]) => {
              setShepherd(prof)
              setQuestions(q ?? [])
              setRoutines(r ?? [])
            })
            .catch((err) => {
              console.error('Circle details load error:', err)
            })
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Circle load error:', err)
        setLoading(false)
      })
  }, [slug, user])

  useEffect(() => {
    if (!user || meetings.length === 0) return
    supabase
      .from('rsvps')
      .select('meeting_id, status')
      .eq('user_id', user.id)
      .in(
        'meeting_id',
        meetings.map((m) => m.id)
      )
      .then(({ data }) => {
        if (data) {
          setRsvps(Object.fromEntries(data.map((r) => [r.meeting_id, r.status])))
        }
      })
  }, [user, meetings])

  const handleRsvp = async (meetingId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!user) return
    await supabase.from('rsvps').upsert(
      { meeting_id: meetingId, user_id: user.id, status },
      { onConflict: 'meeting_id,user_id' }
    )
    setRsvps((prev) => ({ ...prev, [meetingId]: status }))
  }

  const handleStartMeet = async (meetingId: string) => {
    if (!isShepherd) return
    hapticSelect()
    const { error } = await supabase
      .from('meetings')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('id', meetingId)
    if (error) {
      showToast('Could not start meet', 'error')
      return
    }
    hapticSuccess()
    showToast('Meet started. Questions are now open.', 'success')
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId ? { ...m, status: 'live', started_at: new Date().toISOString() } : m
      )
    )
    navigate(`/meetings/${meetingId}/live`)
  }

  const handleCancelMeeting = async (meetingId: string) => {
    if (!isShepherd) return
    await cancelMeetingNotifications(meetingId)
    const { error } = await supabase
      .from('meetings')
      .update({ status: 'cancelled' })
      .eq('id', meetingId)
    if (error) {
      showToast('Could not cancel meeting', 'error')
      return
    }
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId))
    showToast('Meeting cancelled', 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-charcoal-muted">Circle not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="px-5 pt-4 pb-4 safe-top">
        <div className="flex items-start justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 mb-2">
            <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
          </button>
          {isShepherd && (
            <button
              onClick={() => navigate(`/shepherd/${circle.id}/analytics`)}
              className="p-2 -mr-2 text-charcoal-muted hover:text-charcoal transition-colors"
              title="Analytics"
            >
              <BarChart3 className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}
        </div>
        <h1 className="font-serif text-2xl text-charcoal">{circle.name}</h1>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
          <span className="text-sm text-charcoal-muted">{circle.location}</span>
        </div>
        {circle.meeting_address && (
          <p className="text-xs text-charcoal-muted mt-1">{circle.meeting_address}</p>
        )}
        {shepherd?.full_name && (
          <div className="flex items-center gap-1.5 mt-2">
            <User className="w-3.5 h-3.5 text-charcoal-muted" strokeWidth={1.5} />
            <span className="text-xs text-charcoal-muted">Shepherded by {shepherd.full_name}</span>
          </div>
        )}
        {circle.description && (
          <p className="text-sm text-charcoal-muted mt-3 leading-relaxed">{circle.description}</p>
        )}
      </div>

      {/* Routine */}
      {routines.length > 0 && (
        <div className="px-5 mb-6">
          <h2 className="text-sm font-medium text-charcoal-light uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            The Flow
          </h2>
          <div className="bg-cream-warm rounded-xl border border-border-soft p-4 space-y-3">
            {routines.map((r, i) => (
              <div key={r.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-terracotta-pale flex items-center justify-center text-[10px] font-medium text-terracotta">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-charcoal">{r.title}</p>
                  {r.description && <p className="text-xs text-charcoal-muted">{r.description}</p>}
                  {r.duration_minutes && (
                    <p className="text-[10px] text-charcoal-muted mt-0.5">{r.duration_minutes} min</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <div className="px-5 mb-6">
          <h2 className="text-sm font-medium text-charcoal-light uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
            Discussion Questions
          </h2>
          <div className="bg-cream-warm rounded-xl border border-border-soft p-4 space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-wheat-pale flex items-center justify-center text-[10px] font-medium text-wheat-dark">
                  {i + 1}
                </span>
                <p className="text-sm text-charcoal">{q.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meetings */}
      <div className="px-5">
        <h2 className="text-sm font-medium text-charcoal-light uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" strokeWidth={1.5} />
          Upcoming Gatherings
        </h2>

        {meetings.length === 0 ? (
          <p className="text-sm text-charcoal-muted">No upcoming meetings.</p>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const status = rsvps[meeting.id]
              const date = new Date(meeting.scheduled_at)
              const hasUnlockedQuestions = unlockedMeetings.has(meeting.id)

              return (
                <div key={meeting.id} className="bg-cream-warm rounded-xl border border-border-soft p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-charcoal">
                      {date.toLocaleDateString('en-AU', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-muted mb-1">
                    {date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                    {meeting.duration_minutes ? ` · ${meeting.duration_minutes} min` : ''}
                  </p>
                  {meeting.meeting_type && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mb-2 inline-block ${
                      meeting.meeting_type === 'digital' ? 'bg-sky-pale text-sky-soft' :
                      meeting.meeting_type === 'hybrid' ? 'bg-wheat-pale text-wheat-dark' :
                      'bg-sage-pale text-sage-dark'
                    }`}>
                      {meeting.meeting_type === 'in_person' ? 'In Person' : meeting.meeting_type === 'digital' ? 'Digital' : 'Hybrid'}
                    </span>
                  )}
                  {meeting.location_name && meeting.meeting_type !== 'digital' && (
                    <p className="text-xs text-charcoal-muted mb-1">{meeting.location_name}</p>
                  )}
                  {meeting.join_url && (meeting.meeting_type === 'digital' || meeting.meeting_type === 'hybrid') && (
                    <button
                      onClick={() => window.open(meeting.join_url!, '_blank')}
                      className="text-xs text-sky-soft flex items-center gap-1 mb-2"
                    >
                      <Video className="w-3 h-3" strokeWidth={1.5} />
                      Join Link <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                    </button>
                  )}
                  {meeting.notes && (
                    <p className="text-xs text-charcoal-muted italic mb-3">{meeting.notes}</p>
                  )}

                  {status ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-sage" strokeWidth={1.5} />
                        <span className="text-sm text-sage capitalize">{status.replace('_', ' ')}</span>
                      </div>
                      <button
                        onClick={() => handleRsvp(meeting.id, 'not_going')}
                        className="text-xs text-terracotta flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" strokeWidth={1.5} />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRsvp(meeting.id, 'going')}
                        className="px-4 py-2 bg-sage text-cream text-xs rounded-full active:scale-95 transition-transform"
                      >
                        Going
                      </button>
                      <button
                        onClick={() => handleRsvp(meeting.id, 'maybe')}
                        className="px-4 py-2 bg-wheat text-midnight text-xs rounded-full active:scale-95 transition-transform"
                      >
                        Maybe
                      </button>
                      <button
                        onClick={() => handleRsvp(meeting.id, 'not_going')}
                        className="px-4 py-2 bg-cream text-charcoal-muted text-xs rounded-full border border-border-soft active:scale-95 transition-transform"
                      >
                        Can't Make It
                      </button>
                    </div>
                  )}

                  {/* Member: Prep Questions button */}
                  {!isShepherd && hasUnlockedQuestions && meeting.status !== 'live' && meeting.status !== 'completed' && status === 'going' && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/meetings/${meeting.id}/live`)}
                      className="w-full mt-3 py-2.5 bg-sage text-cream rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Prep Questions
                    </motion.button>
                  )}

                  {/* Shepherd: Start Meet */}
                  {isShepherd && meeting.status !== 'live' && meeting.status !== 'completed' && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStartMeet(meeting.id)}
                      className="w-full mt-3 py-2.5 bg-midnight text-cream rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Start Meet
                    </motion.button>
                  )}

                  {/* Shepherd: Live controls */}
                  {isShepherd && meeting.status === 'live' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => navigate(`/meetings/${meeting.id}/live`)}
                        className="flex-1 py-2.5 bg-midnight text-cream rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                        View Live
                      </button>
                      <button
                        onClick={() => navigate(`/shepherd/meetings/${meeting.id}/responses`)}
                        className="flex-1 py-2.5 bg-wheat text-midnight rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Responses
                      </button>
                    </div>
                  )}

                  {/* Member: Join Live */}
                  {!isShepherd && meeting.status === 'live' && status === 'going' && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/meetings/${meeting.id}/live`)}
                      className="w-full mt-3 py-2.5 bg-midnight text-cream rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Join Live Meet
                    </motion.button>
                  )}

                  {/* Shepherd: Cancel / Reschedule */}
                  {isShepherd && meeting.status !== 'live' && meeting.status !== 'completed' && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => navigate(`/shepherd/${circle.id}/meetings`, { state: { editMeetingId: meeting.id } })}
                        className="flex-1 py-2 bg-white text-charcoal rounded-xl text-xs font-medium flex items-center justify-center gap-1 border border-border-soft active:scale-95 transition-transform"
                      >
                        <Pencil className="w-3 h-3" strokeWidth={1.5} />
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelMeeting(meeting.id)}
                        className="flex-1 py-2 bg-white text-terracotta rounded-xl text-xs font-medium flex items-center justify-center gap-1 border border-border-soft active:scale-95 transition-transform"
                      >
                        <XCircle className="w-3 h-3" strokeWidth={1.5} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
