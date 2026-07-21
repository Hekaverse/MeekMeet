import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, CheckCircle2, User } from 'lucide-react'
import { hapticSuccess } from '@/lib/haptics'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function ContactAdminScreen() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill in both subject and message', 'error')
      return
    }
    if (subject.trim().length < 3) {
      showToast('Subject must be at least 3 characters', 'error')
      return
    }
    if (message.trim().length < 10) {
      showToast('Message must be at least 10 characters', 'error')
      return
    }

    setSubmitting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        showToast('Please sign in first', 'error')
        setSubmitting(false)
        return
      }

      const { error } = await supabase.from('admin_messages').insert({
        user_id: sessionData.session.user.id,
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
        email: user?.email || 'unknown',
        subject: subject.trim(),
        message: message.trim(),
      })

      if (error) throw error

      hapticSuccess()
      setSubmitted(true)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to send message', 'error')
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
          Message Sent
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-charcoal-muted max-w-xs mb-8"
        >
          Thanks for reaching out. The team will get back to you as soon as possible.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => { setSubmitted(false); setSubject(''); setMessage('') }}
          className="px-6 py-3 bg-midnight text-cream rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          Send Another
        </motion.button>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => navigate(-1)}
          className="mt-3 px-6 py-3 border border-border-soft text-charcoal rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          Go Back
        </motion.button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream safe-top px-5 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="font-serif text-xl text-charcoal">Contact Admin</h1>
          <p className="text-xs text-charcoal-muted">Send a message to the Meek Meet team</p>
        </div>
      </div>

      {/* User info */}
      <div className="bg-cream-warm rounded-xl border border-border-soft p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-midnight flex items-center justify-center">
            <User className="w-4 h-4 text-cream" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-charcoal truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'}
            </p>
            <p className="text-xs text-charcoal-muted truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's this about?"
            maxLength={120}
            className="w-full px-4 py-3 bg-cream-warm border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-midnight/20"
          />
          <p className="text-[10px] text-charcoal-muted/60 mt-1 text-right">{subject.length}/120</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your question, feedback, or issue in detail..."
            rows={6}
            maxLength={2000}
            className="w-full px-4 py-3 bg-cream-warm border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-midnight/20 resize-none"
          />
          <p className="text-[10px] text-charcoal-muted/60 mt-1 text-right">{message.length}/2000</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !subject.trim() || !message.trim()}
          className="w-full py-3.5 bg-midnight text-cream rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {submitting ? (
            <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" strokeWidth={1.5} />
              Send Message
            </>
          )}
        </button>
      </div>
    </div>
  )
}
