import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Clock, FileText, Send, CheckCircle2, BookOpen, Video, MapPinned } from 'lucide-react'
import { hapticSelect, hapticSuccess } from '@/lib/haptics'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'

type ReleaseMode = 'immediate' | 'day_before' | 'live_reveal'
type MeetingType = 'in_person' | 'digital' | 'hybrid'

export default function MeetingCreateScreen() {
  const { circleId } = useParams<{ circleId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const now = new Date()
  const defaultDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16)

  const [form, setForm] = useState({
    scheduledAt: defaultDate,
    locationName: '',
    locationAddress: '',
    durationMinutes: 120,
    notes: '',
    questionsReleaseMode: 'immediate' as ReleaseMode,
    meetingType: 'in_person' as MeetingType,
    joinUrl: '',
  })

  const handleSubmit = async () => {
    if (!form.scheduledAt) {
      showToast('Please fill in date and time', 'error')
      return
    }
    if (form.meetingType !== 'digital' && !form.locationName) {
      showToast('Please fill in location name', 'error')
      return
    }
    if ((form.meetingType === 'digital' || form.meetingType === 'hybrid') && !form.joinUrl.trim()) {
      showToast('Please add a join link for digital meetings', 'error')
      return
    }
    if (!circleId) {
      showToast('Circle not found', 'error')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          circle_id: circleId,
          scheduled_at: new Date(form.scheduledAt).toISOString(),
          location_name: form.locationName || null,
          location_address: form.locationAddress || null,
          duration_minutes: form.durationMinutes,
          notes: form.notes || null,
          status: 'scheduled',
          questions_release_mode: form.questionsReleaseMode,
          meeting_type: form.meetingType,
          join_url: form.joinUrl.trim() || null,
        })
        .select('id')
        .single()

      if (error) throw error

      hapticSuccess()
      setSubmitted(true)

      setTimeout(() => {
        navigate(`/shepherd/meetings/${data.id}/questions`)
      }, 1500)
    } catch {
      showToast('Could not create meeting. Please try again.', 'error')
    }
    setSubmitting(false)
  }

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
          Meeting Created
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-charcoal-muted leading-relaxed max-w-xs mb-2"
        >
          Now select the questions your circle will answer.
        </motion.p>
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
          <h1 className="font-serif text-lg text-midnight">Schedule a Meet</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* Date & Time */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            Date & Time *
          </label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </motion.div>

        {/* Meeting Type */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" strokeWidth={1.5} />
            Meet Type
          </label>
          <div className="flex gap-2">
            {[
              { key: 'in_person', label: 'In Person', icon: MapPinned },
              { key: 'digital', label: 'Digital', icon: Video },
              { key: 'hybrid', label: 'Hybrid', icon: MapPin },
            ].map((t) => {
              const Icon = t.icon
              const active = form.meetingType === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setForm((f) => ({ ...f, meetingType: t.key as MeetingType }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                    active
                      ? 'bg-midnight text-cream border-midnight'
                      : 'bg-white text-charcoal-muted border-border-soft'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Location (in_person / hybrid only) */}
        {(form.meetingType === 'in_person' || form.meetingType === 'hybrid') && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                Location Name {form.meetingType === 'in_person' ? '*' : ''}
              </label>
              <input
                value={form.locationName}
                onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
                placeholder="e.g. St. Mary's Community Hall"
                className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                Address
              </label>
              <input
                value={form.locationAddress}
                onChange={(e) => setForm((f) => ({ ...f, locationAddress: e.target.value }))}
                placeholder="123 Main St, Sydney NSW 2000"
                className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </motion.div>
          </>
        )}

        {/* Join URL (digital / hybrid) */}
        {(form.meetingType === 'digital' || form.meetingType === 'hybrid') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" strokeWidth={1.5} />
              Join Link *
            </label>
            <input
              value={form.joinUrl}
              onChange={(e) => setForm((f) => ({ ...f, joinUrl: e.target.value }))}
              placeholder="https://zoom.us/j/... or Google Meet link"
              className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </motion.div>
        )}

        {/* Duration */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            Duration (minutes)
          </label>
          <div className="flex gap-2">
            {[60, 90, 120, 150, 180].map((m) => (
              <button
                key={m}
                onClick={() => setForm((f) => ({ ...f, durationMinutes: m }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  form.durationMinutes === m
                    ? 'bg-midnight text-cream border-midnight'
                    : 'bg-white text-charcoal-muted border-border-soft'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </motion.div>

        {/* Question Release Mode */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
            When should questions be visible?
          </label>
          <div className="space-y-2">
            {[
              { key: 'immediate', label: 'Immediately', desc: 'Members see questions as soon as you select them' },
              { key: 'day_before', label: 'Day Before', desc: 'Questions release 24 hours before the meet' },
              { key: 'live_reveal', label: 'Live Reveal', desc: 'Questions unlock one by one during the meet' },
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setForm((f) => ({ ...f, questionsReleaseMode: mode.key as ReleaseMode }))}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  form.questionsReleaseMode === mode.key
                    ? 'bg-terracotta-pale border-terracotta/20'
                    : 'bg-white border-border-soft'
                }`}
              >
                <p className={`text-sm font-medium ${form.questionsReleaseMode === mode.key ? 'text-charcoal' : 'text-charcoal-muted'}`}>
                  {mode.label}
                </p>
                <p className="text-[11px] text-charcoal-muted/70 mt-0.5">{mode.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Any special instructions for attendees?"
            rows={3}
            className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta resize-none"
          />
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-midnight text-cream rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" strokeWidth={1.5} />
                Create Meeting
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
