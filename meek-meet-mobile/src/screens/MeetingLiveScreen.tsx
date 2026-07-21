import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Lock,
  Unlock,
  Users,
  Sparkles,
  BookOpen,
  Video,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { hapticSelect, hapticSuccess } from '@/lib/haptics'

interface MeetingData {
  id: string
  circle_id: string
  status: string
  started_at: string | null
  scheduled_at: string
  questions_release_mode: string
  meeting_type?: 'in_person' | 'digital' | 'hybrid'
  join_url?: string | null
  location_name?: string | null
}

interface MeetingQuestion {
  id: string
  question_id: string
  content: string
  category: string
  unlock_after_minutes: number
  order_index: number
  unlocked_at: string | null
}

interface ResponseData {
  id: string
  question_id: string
  content: string
}

type Phase = 'waiting' | 'active' | 'completed'

export default function MeetingLiveScreen() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [meeting, setMeeting] = useState<MeetingData | null>(null)
  const [questions, setQuestions] = useState<MeetingQuestion[]>([])
  const [responses, setResponses] = useState<Record<string, ResponseData>>({})
  const [phase, setPhase] = useState<Phase>('waiting')
  const activeQuestionIndex = useMemo(() => {
    if (phase !== 'active') return -1
    // First unlocked, unanswered question
    return questions.findIndex((q) => isQuestionUnlocked(q) && !responses[q.question_id])
  }, [questions, responses, phase])
  const [answerDraft, setAnswerDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load meeting and questions
  useEffect(() => {
    if (!meetingId) return
    async function load() {
      const [{ data: m }, { data: q }] = await Promise.all([
        supabase.from('meetings').select('*').eq('id', meetingId).single(),
        supabase.from('meeting_questions').select('*').eq('meeting_id', meetingId).order('order_index', { ascending: true }),
      ])
      setMeeting(m)
      setQuestions(q ?? [])
      setLoading(false)
    }
    load()
  }, [meetingId])

  // Load existing responses
  useEffect(() => {
    if (!meetingId || !user) return
    supabase
      .from('responses')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, ResponseData> = {}
          for (const r of data) {
            map[r.question_id] = r
          }
          setResponses(map)
        }
      })
  }, [meetingId, user])

  // Subscribe to meeting status changes
  useEffect(() => {
    if (!meetingId) return
    const channel = supabase
      .channel(`meeting-${meetingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meetings', filter: `id=eq.${meetingId}` },
        (payload) => {
          const updated = payload.new as MeetingData
          setMeeting(updated)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [meetingId])

  // Derive phase from meeting status + answers
  useEffect(() => {
    if (!meeting) return
    if (meeting.status === 'completed') {
      setPhase('completed')
      return
    }
    const answeredCount = questions.filter((q) => responses[q.question_id]).length
    if (answeredCount >= questions.length && questions.length > 0 && meeting.status === 'live') {
      setPhase('completed')
      return
    }
    if (meeting.status === 'live') {
      setPhase('active')
      return
    }
    setPhase('waiting')
  }, [meeting, questions, responses])

  const isQuestionUnlocked = (q: MeetingQuestion) => {
    if (!q.unlocked_at) return false
    return new Date(q.unlocked_at) <= new Date()
  }

  const canSubmitAnswer = (q: MeetingQuestion) => {
    return meeting?.status === 'live' && isQuestionUnlocked(q)
  }

  const handleSubmitResponse = async (questionId: string) => {
    if (!answerDraft.trim() || !meetingId || !user) return
    if (responses[questionId]) {
      showToast('You already answered this question', 'error')
      return
    }
    hapticSelect()
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('responses')
        .insert({
          meeting_id: meetingId,
          question_id: questionId,
          user_id: user.id,
          content: answerDraft.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setResponses((prev) => ({ ...prev, [questionId]: data }))
      setAnswerDraft('')
      hapticSuccess()
      showToast('Response recorded', 'success')
    } catch {
      showToast('Could not save response', 'error')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-cream px-5 pt-6 pb-8 flex items-center justify-center">
        <p className="text-charcoal-muted">Meeting not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm border-b border-border-soft px-5 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-midnight" strokeWidth={1.5} />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-lg text-midnight">Live Meet</h1>
            <p className="text-xs text-charcoal-muted">
              {phase === 'waiting' && 'Waiting to begin'}
              {phase === 'active' && 'Meeting in progress'}
              {phase === 'completed' && 'All done'}
            </p>
          </div>
        </div>

        {/* Digital join link */}
        {meeting.join_url && (meeting.meeting_type === 'digital' || meeting.meeting_type === 'hybrid') && (
          <button
            onClick={() => window.open(meeting.join_url!, '_blank')}
            className="mt-2 w-full py-2.5 bg-sky-soft text-cream rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <Video className="w-3.5 h-3.5" strokeWidth={1.5} />
            Open Join Link
            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="px-5 py-4 pb-24">
        {/* Phase: Waiting */}
        {phase === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-wheat-pale flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-wheat-dark" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl text-midnight mb-3">The meet will begin shortly</h2>
            <p className="text-sm text-charcoal-muted leading-relaxed max-w-xs mx-auto mb-2">
              The shepherd will start the meet when everyone has gathered.
            </p>
            <p className="text-xs text-charcoal-muted/60">
              Scheduled: {new Date(meeting.scheduled_at).toLocaleString('en-AU')}
            </p>

            {/* Preview questions for immediate/day_before modes */}
            {(meeting.questions_release_mode === 'immediate' || meeting.questions_release_mode === 'day_before') && questions.length > 0 && (
              <div className="mt-8 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-sage" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-midnight">Questions to prepare</p>
                </div>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div key={q.id} className="bg-cream-warm rounded-xl border border-border-soft p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center text-[10px] font-medium text-sage-dark">
                          {i + 1}
                        </span>
                        <span className="text-xs text-charcoal-muted uppercase tracking-wider">{q.category}</span>
                      </div>
                      <p className="text-sm text-charcoal leading-relaxed">{q.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Phase: Active — show questions */}
        {phase === 'active' && (
          <div className="space-y-4">
            {questions.map((q, i) => {
              const unlocked = isQuestionUnlocked(q)
              const canAnswer = canSubmitAnswer(q)
              const isAnswered = !!responses[q.question_id]
              const isCurrent = i === activeQuestionIndex && !isAnswered && canAnswer

              if (!unlocked) {
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-cream-warm/50 rounded-2xl border border-border-soft p-5 opacity-60"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                      <span className="text-xs text-charcoal-muted uppercase tracking-wider">
                        Question {i + 1}
                      </span>
                      <span className="text-xs text-charcoal-muted ml-auto">
                        Locked
                      </span>
                    </div>
                    <p className="text-sm text-charcoal-muted">{q.content}</p>
                  </motion.div>
                )
              }

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-cream-warm rounded-2xl border p-5 ${
                    isCurrent ? 'border-terracotta/30 shadow-sm' : 'border-border-soft'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {isAnswered ? (
                      <CheckCircle2 className="w-4 h-4 text-sage" strokeWidth={1.5} />
                    ) : canAnswer ? (
                      <Unlock className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                    ) : (
                      <Lock className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                    )}
                    <span className="text-xs text-charcoal-muted uppercase tracking-wider">
                      Question {i + 1}
                    </span>
                    {isAnswered && (
                      <span className="text-xs text-sage font-medium ml-auto">Answered</span>
                    )}
                  </div>

                  <p className="text-base text-charcoal leading-relaxed mb-4">{q.content}</p>

                  <AnimatePresence mode="wait">
                    {isAnswered ? (
                      <motion.div
                        key="answered"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-xl border border-border-soft p-4"
                      >
                        <p className="text-sm text-charcoal leading-relaxed">
                          {responses[q.question_id]?.content}
                        </p>
                      </motion.div>
                    ) : canAnswer ? (
                      <motion.div
                        key="input"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                      >
                        <textarea
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          placeholder="Share your thoughts..."
                          rows={4}
                          className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta resize-none"
                        />
                        <button
                          onClick={() => handleSubmitResponse(q.question_id)}
                          disabled={!answerDraft.trim() || submitting}
                          className="w-full py-3 bg-midnight text-cream rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                        >
                          {submitting ? (
                            <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" strokeWidth={1.5} />
                              Submit Response
                            </>
                          )}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="readonly"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/50 rounded-xl border border-border-soft p-4"
                      >
                        <p className="text-sm text-charcoal-muted">
                          This question is visible for preparation. Answers open when the meet begins.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Phase: Completed */}
        {phase === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-sage-dark" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl text-midnight mb-3">Thank you</h2>
            <p className="text-sm text-charcoal-muted leading-relaxed max-w-xs mx-auto">
              Your responses have been recorded. The shepherd will review them to find patterns and insights.
            </p>
            <button
              onClick={() => navigate('/circles')}
              className="mt-6 px-6 py-3 bg-midnight text-cream rounded-xl text-sm font-medium active:scale-95 transition-transform"
            >
              Back to Circles
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
