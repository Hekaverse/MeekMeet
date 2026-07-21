import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Globe,
  Phone,
  Church,
  Heart,
  Sparkles,
  Landmark,
  Users,
  ExternalLink,
  Navigation,
  Star,
  Plus,
  X,
  Check,
  AlertCircle,
} from 'lucide-react'
import { hapticSelect, hapticSuccess } from '@/lib/haptics'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { fetchPlaceById, getPlaceDetails, getCachedPlace } from '@/lib/places'
import type { ExternalGathering, MeetingTime } from '@/types'

const traditionIcons: Record<string, React.ElementType> = {
  christian: Church,
  islamic: Globe,
  jewish: Sparkles,
  buddhist: Heart,
  hindu: Landmark,
  interfaith: Users,
}

const traditionColors: Record<string, string> = {
  christian: 'bg-sage-pale text-sage-dark',
  islamic: 'bg-wheat-pale text-wheat-dark',
  jewish: 'bg-sky-pale text-sky-soft',
  buddhist: 'bg-terracotta-pale text-terracotta',
  hindu: 'bg-orange-100 text-orange-700',
  interfaith: 'bg-violet-100 text-violet-700',
}

const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Daily', 'First Sunday']

interface CrowdsourcedTime {
  id: string
  place_id: string
  day: string
  time: string
  label: string
  is_verified: boolean
  submitted_by: string | null
  created_at: string
}

export default function GatheringDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [gathering, setGathering] = useState<ExternalGathering | null>(null)
  const [loading, setLoading] = useState(true)
  const [crowdsourcedTimes, setCrowdsourcedTimes] = useState<CrowdsourcedTime[]>([])
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newTime, setNewTime] = useState({ day: 'Sunday', time: '', label: 'Service' })
  const [placeDetails, setPlaceDetails] = useState<{ phone?: string; website?: string; openingHours?: string[] }>({})

  useEffect(() => {
    async function load() {
      setLoading(true)

      // 1. Try curated JSON
      let found: ExternalGathering | null = null
      try {
        const res = await fetch('/data/gatherings.json')
        const data = await res.json()
        found = data.gatherings.find((g: ExternalGathering) => g.id === id) || null
      } catch {
        // ignore
      }

      // 2. Try cache / Google Places API
      if (!found && id) {
        found = getCachedPlace(id) || null
        if (!found) {
          found = await fetchPlaceById(id)
        }
      }

      if (found) {
        // 3. Fetch Google Place details if we have a place_id
        if (found.googlePlaceId && import.meta.env.VITE_GOOGLE_PLACES_API_KEY) {
          const details = await getPlaceDetails(found.googlePlaceId)
          setPlaceDetails(details)
          // Merge details into gathering
          found = {
            ...found,
            phone: found.phone || details.phone || '',
            website: found.website || details.website || '',
          }
        }

        // 4. Fetch crowdsourced service times
        if (id) {
          const { data: times } = await supabase
            .from('place_service_times')
            .select('*')
            .eq('place_id', id)
            .order('created_at', { ascending: true })
          if (times) setCrowdsourcedTimes(times)
        }
      }

      setGathering(found)
      setLoading(false)
    }
    load()
  }, [id])

  const allTimes: MeetingTime[] = useMemo(() => {
    const curated = gathering?.meetingTimes || []
    const crowdsourced = crowdsourcedTimes.map((t) => ({
      day: t.day,
      time: t.time,
      label: t.label + (t.is_verified ? '' : ' (unverified)'),
    }))
    return [...curated, ...crowdsourced]
  }, [gathering, crowdsourcedTimes])

  const sortedTimes = useMemo(() => {
    return [...allTimes].sort((a, b) => {
      const ai = dayOrder.indexOf(a.day)
      const bi = dayOrder.indexOf(b.day)
      if (ai !== bi) return ai - bi
      return a.time.localeCompare(b.time)
    })
  }, [allTimes])

  const groupedTimes = sortedTimes.reduce<Record<string, typeof sortedTimes>>((acc, t) => {
    if (!acc[t.day]) acc[t.day] = []
    acc[t.day].push(t)
    return acc
  }, {})

  const openMaps = () => {
    if (!gathering) return
    hapticSelect()
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gathering.address || gathering.name)}`
    window.open(url, '_blank')
  }

  const openWebsite = () => {
    const url = gathering?.website || placeDetails.website
    if (!url) return
    hapticSelect()
    window.open(url, '_blank')
  }

  const callPhone = () => {
    const phone = gathering?.phone || placeDetails.phone
    if (!phone) return
    hapticSelect()
    window.open(`tel:${phone}`, '_self')
  }

  const handleSubmitTime = async () => {
    if (!id || !newTime.time.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('place_service_times').insert({
      place_id: id,
      day: newTime.day,
      time: newTime.time.trim(),
      label: newTime.label.trim() || 'Service',
    })
    if (error) {
      showToast('Could not submit time: ' + error.message, 'error')
    } else {
      showToast('Thank you! Your submission will be reviewed.', 'success')
      hapticSuccess()
      setShowSubmitForm(false)
      setNewTime({ day: 'Sunday', time: '', label: 'Service' })
      // Refresh
      const { data: times } = await supabase
        .from('place_service_times')
        .select('*')
        .eq('place_id', id)
        .order('created_at', { ascending: true })
      if (times) setCrowdsourcedTimes(times)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!gathering) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-cream">
        <AlertCircle className="w-10 h-10 text-charcoal-muted mb-3" strokeWidth={1.5} />
        <p className="text-charcoal-muted text-base mb-2">Gathering not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-midnight text-cream rounded-xl text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Go Back
        </button>
      </div>
    )
  }

  const TraditionIcon = traditionIcons[gathering.tradition] || Users
  const colorClass = traditionColors[gathering.tradition] || 'bg-midnight/5 text-charcoal-muted'

  return (
    <div className="min-h-screen bg-cream pb-8">
      {/* Header */}
      <div className="px-5 pt-4 pb-6 safe-top">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 mb-3"
        >
          <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
        </motion.button>

        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
            <TraditionIcon className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-midnight">{gathering.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${colorClass}`}>
                {gathering.tradition}
              </span>
              <span className="text-xs text-charcoal-muted">{gathering.denomination}</span>
              {gathering.googleRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-wheat-dark fill-wheat-dark" strokeWidth={1.5} />
                  <span className="text-xs text-wheat-dark font-medium">{gathering.googleRating}</span>
                  <span className="text-xs text-charcoal-muted">({gathering.googleRatingCount})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-6"
      >
        <p className="text-base text-charcoal leading-relaxed">{gathering.description}</p>
      </motion.div>

      {/* Location & Contact */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-5 mb-6"
      >
        <div className="bg-white rounded-2xl border border-border-soft p-5 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
              <span className="text-sm font-medium text-charcoal">{gathering.location}</span>
            </div>
            <p className="text-sm text-charcoal-muted ml-6">{gathering.address}</p>
          </div>

          {(gathering.phone || placeDetails.phone) && (
            <button
              onClick={callPhone}
              className="flex items-center gap-2 w-full text-left active:opacity-60 transition-opacity"
            >
              <Phone className="w-4 h-4 text-sage" strokeWidth={1.5} />
              <span className="text-sm text-charcoal">{gathering.phone || placeDetails.phone}</span>
            </button>
          )}

          {(gathering.website || placeDetails.website) && (
            <button
              onClick={openWebsite}
              className="flex items-center gap-2 w-full text-left active:opacity-60 transition-opacity"
            >
              <Globe className="w-4 h-4 text-sky-soft" strokeWidth={1.5} />
              <span className="text-sm text-charcoal">{(gathering.website || placeDetails.website || '').replace(/^https?:\/\//, '')}</span>
              <ExternalLink className="w-3 h-3 text-charcoal-muted ml-auto" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Meeting Times */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-charcoal-muted uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            Service Times
          </h2>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              hapticSelect()
              setShowSubmitForm(true)
            }}
            className="flex items-center gap-1 text-xs text-terracotta font-medium"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Add time
          </motion.button>
        </div>

        <div className="bg-white rounded-2xl border border-border-soft p-5 shadow-sm space-y-4">
          {Object.entries(groupedTimes).length > 0 ? (
            Object.entries(groupedTimes).map(([day, times]) => (
              <div key={day}>
                <p className="text-sm font-medium text-midnight mb-2">{day}</p>
                <div className="space-y-2">
                  {times.map((t, i) => (
                    <div
                      key={`${day}-${i}`}
                      className="flex items-center justify-between bg-cream-warm rounded-xl px-4 py-3"
                    >
                      <span className="text-sm font-medium text-charcoal">{t.time}</span>
                      <span className="text-xs text-charcoal-muted">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-charcoal-muted mb-2">No service times listed yet.</p>
              <p className="text-xs text-charcoal-muted">
                Be the first to share what you know.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Submit Time Modal */}
      <AnimatePresence>
        {showSubmitForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowSubmitForm(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-cream rounded-2xl p-5 border border-border-soft shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-midnight">Submit Service Time</h3>
                <button onClick={() => setShowSubmitForm(false)}>
                  <X className="w-5 h-5 text-charcoal-muted" strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1 block">Day</label>
                  <select
                    value={newTime.day}
                    onChange={(e) => setNewTime({ ...newTime, day: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-border-soft rounded-xl text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-terracotta"
                  >
                    {dayOrder.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1 block">Time</label>
                  <input
                    type="time"
                    value={newTime.time}
                    onChange={(e) => setNewTime({ ...newTime, time: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-border-soft rounded-xl text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1 block">Label</label>
                  <input
                    value={newTime.label}
                    onChange={(e) => setNewTime({ ...newTime, label: e.target.value })}
                    placeholder="e.g. Sunday Service, Jumu'ah..."
                    className="w-full px-3 py-2.5 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmitTime}
                disabled={!newTime.time.trim() || submitting}
                className="w-full mt-5 py-3 bg-midnight text-cream rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" strokeWidth={1.5} />
                )}
                {submitting ? 'Submitting...' : 'Submit Time'}
              </motion.button>

              <p className="text-xs text-charcoal-muted text-center mt-3">
                Submissions are reviewed for accuracy.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="px-5"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openMaps}
          className="w-full py-3.5 bg-midnight text-cream rounded-2xl font-medium text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Navigation className="w-4 h-4" strokeWidth={1.5} />
          Get Directions
        </motion.button>
      </motion.div>
    </div>
  )
}
