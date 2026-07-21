import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Send, CheckCircle2, Heart, Users, BookOpen } from 'lucide-react'
import { hapticSelect, hapticSuccess } from '@/lib/haptics'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'

export default function ShepherdApplyScreen() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    location: '',
    tradition: '',
    experience: '',
    motivation: '',
    vision: '',
  })

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.motivation.trim()) {
      showToast('Please fill in your name and motivation', 'error')
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

      await supabase.from('shepherd_applications').insert({
        user_id: sessionData.session.user.id,
        full_name: form.fullName,
        email: form.email,
        location: form.location,
        tradition: form.tradition,
        experience: form.experience,
        motivation: form.motivation,
        vision: form.vision,
        status: 'pending',
      })

      hapticSuccess()
      setSubmitted(true)
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
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
          Application Received
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-charcoal-muted leading-relaxed max-w-xs mb-8"
        >
          Thank you for your willingness to serve. We review every application with prayerful care. You will hear from us within 7 days.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/me')}
          className="px-6 py-3 bg-midnight text-cream rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          Return to Sanctuary
        </motion.button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm border-b border-border-soft px-5 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={() => { hapticSelect(); navigate(-1) }} className="p-2 -ml-2 active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5 text-midnight" strokeWidth={1.5} />
          </button>
          <h1 className="font-serif text-lg text-midnight">Become a Shepherd</h1>
        </div>
      </div>

      <div className="px-5 py-6 pb-24 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream-warm rounded-2xl border border-border-soft p-5 shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-terracotta-pale flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-terracotta" strokeWidth={1.5} />
          </div>
          <h2 className="font-medium text-midnight text-base mb-2">Feel called to lead?</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Shepherds are compassionate guides who hold space for circles in their community.
            They do not preach doctrine — they facilitate encounter, listening, and growth across traditions.
          </p>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Heart, label: 'Compassion', desc: 'Lead with empathy' },
            { icon: Users, label: 'Inclusion', desc: 'Welcome all paths' },
            { icon: BookOpen, label: 'Wisdom', desc: 'Study deeply' },
          ].map((v) => (
            <div key={v.label} className="bg-white rounded-xl border border-border-soft p-3 text-center">
              <v.icon className="w-5 h-5 text-terracotta mx-auto mb-1.5" strokeWidth={1.5} />
              <p className="text-xs font-medium text-midnight">{v.label}</p>
              <p className="text-[10px] text-charcoal-muted">{v.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block">
              Full Name *
            </label>
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              type="email"
              className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block">
              Location
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="City, Country"
              className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block">
              Primary Tradition
            </label>
            <select
              value={form.tradition}
              onChange={(e) => setForm((f) => ({ ...f, tradition: e.target.value }))}
              className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-terracotta appearance-none"
            >
              <option value="">Select a tradition...</option>
              <option value="christian">Christian</option>
              <option value="islamic">Islamic</option>
              <option value="jewish">Jewish</option>
              <option value="buddhist">Buddhist</option>
              <option value="mormon">Latter-day Saint</option>
              <option value="interfaith">Interfaith / No single tradition</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block">
              Experience
            </label>
            <textarea
              value={form.experience}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
              placeholder="Any prior experience in community leadership, teaching, or spiritual guidance?"
              rows={3}
              className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block">
              Why do you feel called? *
            </label>
            <textarea
              value={form.motivation}
              onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
              placeholder="Share briefly what draws you to shepherd a Meek Meet circle..."
              rows={4}
              className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block">
              Your Vision
            </label>
            <textarea
              value={form.vision}
              onChange={(e) => setForm((f) => ({ ...f, vision: e.target.value }))}
              placeholder="What kind of circle would you hope to create? Who would it serve?"
              rows={3}
              className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta resize-none"
            />
          </div>

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
                Submit Application
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
