import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Mail,
  MapPin,
  Church,
  Loader2,
  Shield,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Heart,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type AppStatus = 'pending' | 'approved' | 'rejected'

interface ShepherdApplication {
  id: string
  user_id: string | null
  full_name: string
  email: string | null
  location: string | null
  tradition: string | null
  experience: string | null
  motivation: string
  vision: string | null
  status: AppStatus
  created_at: string
}

export default function AdminApplicationsScreen() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [applications, setApplications] = useState<ShepherdApplication[]>([])
  const [filter, setFilter] = useState<AppStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || role !== 'admin') {
      setLoading(false)
      return
    }
    loadApps()
  }, [user, role])

  const loadApps = async () => {
    setLoading(true)
    let q = supabase
      .from('shepherd_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    if (error) {
      console.error('Failed to load applications:', error)
    }
    setApplications((data ?? []) as ShepherdApplication[])
    setLoading(false)
  }

  useEffect(() => {
    loadApps()
  }, [filter])

  const approve = async (app: ShepherdApplication) => {
    setActingId(app.id)
    const { error } = await supabase.rpc('review_shepherd_application', {
      p_application_id: app.id,
      p_decision: 'approved',
    })

    if (error) {
      console.error('Failed to approve application:', error)
    } else {
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: 'approved' } : a)))
    }
    setActingId(null)
  }

  const reject = async (app: ShepherdApplication) => {
    setActingId(app.id)
    const { error } = await supabase.rpc('review_shepherd_application', {
      p_application_id: app.id,
      p_decision: 'rejected',
    })
    if (error) {
      console.error('Failed to reject application:', error)
    } else {
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: 'rejected' } : a)))
    }
    setActingId(null)
  }

  const statusBadge = (status: AppStatus) => {
    const styles = {
      pending: 'bg-wheat-pale text-wheat-dark',
      approved: 'bg-sage-pale text-sage-dark',
      rejected: 'bg-terracotta-pale text-terracotta',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-charcoal-muted">You do not have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6 safe-top">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-xl text-charcoal">Applications</h1>
          <p className="text-xs text-charcoal-muted">Review shepherd applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f ? 'bg-midnight text-cream' : 'bg-cream-warm text-charcoal-muted border border-border-soft'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-terracotta animate-spin" strokeWidth={1.5} />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-charcoal-muted mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-charcoal-muted text-sm">No applications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cream-warm rounded-xl border border-border-soft p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                {statusBadge(app.status)}
                <span className="text-[10px] text-charcoal-muted">
                  {new Date(app.created_at).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-terracotta" strokeWidth={1.5} />
                  <span className="text-sm text-charcoal font-medium">{app.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-terracotta" strokeWidth={1.5} />
                  <span className="text-sm text-charcoal">{app.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sage" strokeWidth={1.5} />
                  <span className="text-sm text-charcoal">{app.location || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Church className="w-3.5 h-3.5 text-wheat" strokeWidth={1.5} />
                  <span className="text-sm text-charcoal capitalize">{app.tradition || '—'}</span>
                </div>
              </div>

              {/* Expandable details */}
              <button
                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                className="flex items-center gap-1.5 text-xs text-charcoal-muted mb-3 hover:text-charcoal transition-colors"
              >
                <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                {expandedId === app.id ? 'Hide details' : 'View application'}
                {expandedId === app.id ? (
                  <ChevronUp className="w-3 h-3" strokeWidth={1.5} />
                ) : (
                  <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
                )}
              </button>

              <AnimatePresence>
                {expandedId === app.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pb-4 border-t border-border-soft pt-3">
                      {app.experience && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <BookOpen className="w-3 h-3 text-charcoal-muted" strokeWidth={1.5} />
                            <span className="text-[10px] font-medium text-charcoal-muted uppercase tracking-wide">Experience</span>
                          </div>
                          <p className="text-sm text-charcoal leading-relaxed">{app.experience}</p>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Heart className="w-3 h-3 text-charcoal-muted" strokeWidth={1.5} />
                          <span className="text-[10px] font-medium text-charcoal-muted uppercase tracking-wide">Motivation</span>
                        </div>
                        <p className="text-sm text-charcoal leading-relaxed">{app.motivation}</p>
                      </div>
                      {app.vision && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Eye className="w-3 h-3 text-charcoal-muted" strokeWidth={1.5} />
                            <span className="text-[10px] font-medium text-charcoal-muted uppercase tracking-wide">Vision</span>
                          </div>
                          <p className="text-sm text-charcoal leading-relaxed">{app.vision}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              {app.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(app)}
                    disabled={actingId === app.id}
                    className="flex-1 py-2.5 bg-sage text-cream rounded-xl text-sm font-medium active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actingId === app.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => reject(app)}
                    disabled={actingId === app.id}
                    className="flex-1 py-2.5 bg-terracotta-pale text-terracotta rounded-xl text-sm font-medium active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actingId === app.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                    Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
