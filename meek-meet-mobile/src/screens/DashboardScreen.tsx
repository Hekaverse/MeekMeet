import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Heart, ArrowRight, Users, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Meeting } from '@/types'

interface CircleSummary {
  id: string
  slug: string
  name: string
  location: string
  nextMeeting?: Meeting
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [myCircles, setMyCircles] = useState<CircleSummary[]>([])
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    Promise.all([
      supabase
        .from('rsvps')
        .select('*, meetings(*, circles(id, slug, name, location))')
        .eq('user_id', user.id)
        .eq('status', 'going')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('meetings')
        .select('*, circles(id, slug, name, location)')
        .eq('is_cancelled', false)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(20),
    ])
      .then(([{ data: rsvps }, { data: meetings }]) => {
        // Extract unique circles from RSVPs
        const circleMap = new Map<string, CircleSummary>()
        rsvps?.forEach((r: any) => {
          const c = r.meetings?.circles
          if (c && !circleMap.has(c.id)) {
            circleMap.set(c.id, { id: c.id, slug: c.slug, name: c.name, location: c.location })
          }
        })

        // Also include circles from upcoming meetings the user might be interested in
        meetings?.forEach((m: any) => {
          const c = m.circles
          if (c && !circleMap.has(c.id)) {
            circleMap.set(c.id, { id: c.id, slug: c.slug, name: c.name, location: c.location })
          }
        })

        const circles = Array.from(circleMap.values())

        // Attach next meeting to each circle
        circles.forEach((circle) => {
          const next = meetings?.find((m: any) => m.circle_id === circle.id)
          if (next) circle.nextMeeting = next
        })

        setMyCircles(circles)
        setAllMeetings(meetings ?? [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Dashboard load error:', err)
        setLoading(false)
      })
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const upcomingMeetings = allMeetings.filter((m) =>
    myCircles.some((c) => c.id === m.circle_id)
  )

  return (
    <div className="min-h-screen px-5 pt-6 pb-8 safe-top">
      <h1 className="font-serif text-2xl text-charcoal mb-2">My Gatherings</h1>
      <p className="text-sm text-charcoal-muted mb-6">
        Your circles and upcoming meetings.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-cream-warm rounded-2xl border border-border-soft p-5">
          <Heart className="w-5 h-5 text-terracotta mb-2" strokeWidth={1.5} />
          <p className="font-serif text-2xl text-charcoal">{myCircles.length}</p>
          <p className="text-xs text-charcoal-muted">My Circles</p>
        </div>
        <div className="bg-cream-warm rounded-2xl border border-border-soft p-5">
          <Calendar className="w-5 h-5 text-wheat-dark mb-2" strokeWidth={1.5} />
          <p className="font-serif text-2xl text-charcoal">{upcomingMeetings.length}</p>
          <p className="text-xs text-charcoal-muted">Upcoming</p>
        </div>
      </div>

      {/* My Circles */}
      <h2 className="text-sm font-medium text-charcoal-light uppercase tracking-wider mb-3">
        My Circles
      </h2>

      {myCircles.length === 0 ? (
        <div className="bg-cream-warm rounded-xl border border-border-soft p-6 text-center mb-8">
          <Users className="w-8 h-8 text-charcoal-muted mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-charcoal-muted text-sm mb-2">No circles yet.</p>
          <button
            onClick={() => navigate('/circles')}
            className="text-sm text-terracotta font-medium"
          >
            Discover circles →
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {myCircles.slice(0, 5).map((circle) => (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/circles/${circle.slug}`)}
              className="bg-cream-warm rounded-xl border border-border-soft p-4 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-charcoal">{circle.name}</p>
                  <p className="text-xs text-charcoal-muted mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" strokeWidth={1.5} />
                    {circle.location}
                  </p>
                  {circle.nextMeeting && (
                    <p className="text-xs text-terracotta mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={1.5} />
                      {new Date(circle.nextMeeting.scheduled_at).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-charcoal-muted flex-shrink-0 mt-1" strokeWidth={1.5} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upcoming Meetings */}
      <h2 className="text-sm font-medium text-charcoal-light uppercase tracking-wider mb-3">
        Upcoming Meetings
      </h2>

      {upcomingMeetings.length === 0 ? (
        <div className="bg-cream-warm rounded-xl border border-border-soft p-6 text-center">
          <Calendar className="w-8 h-8 text-charcoal-muted mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-charcoal-muted text-sm">No upcoming meetings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingMeetings.slice(0, 5).map((meeting: any) => (
            <div
              key={meeting.id}
              className="bg-cream-warm rounded-xl border border-border-soft p-4"
            >
              <p className="font-medium text-charcoal">{meeting.circles?.name}</p>
              <p className="text-xs text-charcoal-muted mt-1">
                {new Date(meeting.scheduled_at).toLocaleDateString('en-AU', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              {meeting.location_name && (
                <p className="text-xs text-charcoal-muted mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" strokeWidth={1.5} />
                  {meeting.location_name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
