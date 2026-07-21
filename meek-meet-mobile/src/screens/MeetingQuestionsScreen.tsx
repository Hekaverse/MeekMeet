import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react'
import { hapticSelect, hapticSuccess } from '@/lib/haptics'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import {
  revolutionaryQuestions,
  questionCategories,
  type RevolutionaryQuestion,
} from '@/data/revolutionary-questions'

interface SelectedQuestion extends RevolutionaryQuestion {
  unlockAfterMinutes: number
}

type ReleaseMode = 'immediate' | 'day_before' | 'live_reveal'

export default function MeetingQuestionsScreen() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<SelectedQuestion[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [meeting, setMeeting] = useState<{ scheduled_at: string; questions_release_mode: ReleaseMode } | null>(null)

  useEffect(() => {
    if (!meetingId) return
    supabase
      .from('meetings')
      .select('scheduled_at, questions_release_mode')
      .eq('id', meetingId)
      .single()
      .then(({ data }) => {
        if (data) setMeeting(data)
      })
  }, [meetingId])

  const toggleQuestion = (q: RevolutionaryQuestion) => {
    hapticSelect()
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === q.id)
      if (exists) {
        return prev.filter((s) => s.id !== q.id)
      }
      if (prev.length >= 8) {
        showToast('Maximum 8 questions', 'error')
        return prev
      }
      return [...prev, { ...q, unlockAfterMinutes: 0 }]
    })
  }

  const updateUnlockTime = (id: string, minutes: number) => {
    setSelected((prev) =>
      prev.map((s) => (s.id === id ? { ...s, unlockAfterMinutes: minutes } : s))
    )
  }

  const computeUnlockedAt = (_q: SelectedQuestion, _index: number): string | null => {
    if (!meeting) return null
    const mode = meeting.questions_release_mode ?? 'live_reveal'

    if (mode === 'immediate') {
      return new Date().toISOString()
    }

    if (mode === 'day_before') {
      const scheduled = new Date(meeting.scheduled_at)
      const release = new Date(scheduled.getTime() - 24 * 60 * 60 * 1000)
      return release.toISOString()
    }

    // live_reveal: computed by DB trigger when meeting goes live
    return null
  }

  const handleSubmit = async () => {
    if (selected.length < 3) {
      showToast('Please select at least 3 questions', 'error')
      return
    }
    if (!meetingId) {
      showToast('Meeting not found', 'error')
      return
    }

    setSubmitting(true)
    try {
      const rows = selected.map((q, i) => ({
        meeting_id: meetingId,
        question_id: q.id,
        content: q.question,
        category: q.category,
        unlock_after_minutes: q.unlockAfterMinutes,
        order_index: i,
        unlocked_at: computeUnlockedAt(q, i),
      }))

      const { error } = await supabase.from('meeting_questions').insert(rows)
      if (error) throw error

      // Update meeting questions_released_at for immediate/day_before
      const mode = meeting?.questions_release_mode ?? 'live_reveal'
      if (mode === 'immediate') {
        await supabase
          .from('meetings')
          .update({ questions_released_at: new Date().toISOString() })
          .eq('id', meetingId)
      } else if (mode === 'day_before') {
        const scheduled = new Date(meeting!.scheduled_at)
        const release = new Date(scheduled.getTime() - 24 * 60 * 60 * 1000)
        await supabase
          .from('meetings')
          .update({ questions_released_at: release.toISOString() })
          .eq('id', meetingId)
      }

      hapticSuccess()
      setSubmitted(true)
    } catch {
      showToast('Could not save questions. Please try again.', 'error')
    }
    setSubmitting(false)
  }

  const modeLabel = {
    immediate: 'immediately',
    day_before: '24 hours before the meet',
    live_reveal: 'during the live meet',
  }[meeting?.questions_release_mode ?? 'live_reveal']

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream safe-top px-5 pt-6 pb-8 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-20 h-20 rounded-full bg-sage-pale flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-sage-dark" strokeWidth={1.5} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-serif text-2xl text-midnight mb-3"
        >
          Questions Set
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-charcoal-muted leading-relaxed max-w-xs mb-8"
        >
          {selected.length} questions will be visible {modeLabel}. Your circle is ready.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/shepherd')}
          className="px-6 py-3 bg-midnight text-cream rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          Return to Dashboard
        </motion.button>
      </div>
    )
  }

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
            <h1 className="font-serif text-lg text-midnight">Select Questions</h1>
            <p className="text-xs text-charcoal-muted">
              {selected.length}/8 selected
            </p>
          </div>
        </div>
      </div>

      {/* Release mode banner */}
      {meeting && (
        <div className="px-5 py-2.5 bg-wheat-pale/40 border-b border-border-soft flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-wheat-dark" strokeWidth={1.5} />
          <p className="text-[11px] text-wheat-dark">
            Questions will be visible <span className="font-medium">{modeLabel}</span>
            {meeting.questions_release_mode === 'live_reveal' && ' — set unlock timing per question below'}
          </p>
        </div>
      )}

      {/* Selected questions summary */}
      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 py-3 bg-wheat-pale/40 border-b border-border-soft"
        >
          <p className="text-xs font-medium text-wheat-dark uppercase tracking-wider mb-2">
            Selected
          </p>
          <div className="space-y-2">
            {selected.map((q, i) => (
              <div
                key={q.id}
                className="flex items-center gap-2 bg-white rounded-lg border border-border-soft px-3 py-2"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-terracotta text-cream flex items-center justify-center text-[10px] font-medium">
                  {i + 1}
                </span>
                <p className="text-xs text-charcoal flex-1 line-clamp-1">{q.question}</p>
                {meeting?.questions_release_mode === 'live_reveal' && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-charcoal-muted" strokeWidth={1.5} />
                    <select
                      value={q.unlockAfterMinutes}
                      onChange={(e) => updateUnlockTime(q.id, Number(e.target.value))}
                      className="text-[10px] bg-transparent text-charcoal-muted focus:outline-none"
                    >
                      <option value={0}>Immediate</option>
                      <option value={5}>5 min</option>
                      <option value={10}>10 min</option>
                      <option value={15}>15 min</option>
                      <option value={20}>20 min</option>
                      <option value={30}>30 min</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={() => toggleQuestion(q)}
                  className="p-1 text-terracotta"
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Question pool */}
      <div className="px-5 py-4 space-y-3 pb-24">
        {questionCategories.map((category) => {
          const qs = revolutionaryQuestions.filter((q) => q.category === category)
          const isExpanded = expandedCategory === category
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cream-warm rounded-2xl border border-border-soft overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-medium text-midnight">{category}</span>
                <span className="text-xs text-charcoal-muted">
                  {qs.filter((q) => selected.find((s) => s.id === q.id)).length}/{qs.length}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                ) : (
                  <ChevronDown className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {qs.map((q) => {
                    const isSelected = selected.find((s) => s.id === q.id)
                    return (
                      <button
                        key={q.id}
                        onClick={() => toggleQuestion(q)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-terracotta-pale border-terracotta/20'
                            : 'bg-white border-border-soft'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                              isSelected
                                ? 'bg-terracotta border-terracotta'
                                : 'border-charcoal-muted/30'
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-cream" strokeWidth={2.5} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm leading-relaxed ${isSelected ? 'text-charcoal' : 'text-charcoal-muted'}`}>
                              {q.question}
                            </p>
                            <p className="text-[10px] text-charcoal-muted/60 mt-1">
                              {q.context}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Floating submit */}
      {selected.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-0 right-0 px-5 z-30"
        >
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-midnight text-cream rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-lg"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" strokeWidth={1.5} />
                Save {selected.length} Questions
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  )
}
