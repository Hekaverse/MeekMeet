import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Clock, Calendar, Settings, ArrowRight, Shield, Plus, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Circle } from '@/types'

export default function ShepherdDashboardScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const uid = user.id
    async function load() {
      // Load circles where user is the legacy shepherd OR in circle_shepherds
      const [{ data: owned }, { data: shepherded }] = await Promise.all([
        supabase.from('circles').select('*').eq('shepherd_id', uid).eq('is_active', true),
        supabase
          .from('circle_shepherds')
          .select('circle:circles(*)')
          .eq('user_id', uid)
          .eq('circle.is_active', true),
      ])

      const map = new Map<string, Circle>()
      for (const c of (owned ?? [])) map.set(c.id, c)
      for (const row of (shepherded ?? []) as any[]) {
        const c = row.circle as Circle | null
        if (c) map.set(c.id, c)
      }
      setCircles(Array.from(map.values()))
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
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
          <h1 className="font-serif text-xl text-charcoal">Shepherd Dashboard</h1>
          <p className="text-xs text-charcoal-muted">Manage your circles</p>
        </div>
      </div>

      {circles.length === 0 ? (
        <div className="bg-cream-warm rounded-2xl border border-border-soft p-10 text-center">
          <Shield className="w-10 h-10 text-charcoal-muted mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-charcoal-muted text-sm mb-4">
            You are not shepherding any circles yet.
          </p>
          <button
            onClick={() => navigate('/circles')}
            className="px-5 py-2.5 bg-midnight text-cream text-sm rounded-full active:scale-95 transition-transform inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Find a Circle
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {circles.map((circle) => (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cream-warm rounded-2xl border border-border-soft p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-serif text-lg text-charcoal">{circle.name}</h2>
                  <p className="text-xs text-charcoal-muted mt-0.5">{circle.location}</p>
                </div>
                <button
                  onClick={() => navigate(`/circles/${circle.slug}`)}
                  className="text-xs text-terracotta flex items-center gap-0.5"
                >
                  View <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/shepherd/${circle.id}/meetings/new`)}
                className="w-full mb-4 py-3 bg-midnight text-cream rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Users className="w-4 h-4" strokeWidth={1.5} />
                Schedule a Meet
              </motion.button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate(`/shepherd/${circle.id}/questions`)}
                  className="bg-cream rounded-xl border border-border-soft p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <BookOpen className="w-5 h-5 text-wheat-dark mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-charcoal">Questions</p>
                  <p className="text-[10px] text-charcoal-muted mt-0.5">Discussion prompts</p>
                </button>

                <button
                  onClick={() => navigate(`/shepherd/${circle.id}/routine`)}
                  className="bg-cream rounded-xl border border-border-soft p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <Clock className="w-5 h-5 text-terracotta mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-charcoal">Routine</p>
                  <p className="text-[10px] text-charcoal-muted mt-0.5">Meeting flow</p>
                </button>

                <button
                  onClick={() => navigate(`/shepherd/${circle.id}/meetings`)}
                  className="bg-cream rounded-xl border border-border-soft p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <Calendar className="w-5 h-5 text-sage-dark mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-charcoal">Meetings</p>
                  <p className="text-[10px] text-charcoal-muted mt-0.5">Schedule & RSVPs</p>
                </button>

                <button
                  onClick={() => navigate(`/shepherd/${circle.id}/settings`)}
                  className="bg-cream rounded-xl border border-border-soft p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <Settings className="w-5 h-5 text-sky-soft mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-charcoal">Settings</p>
                  <p className="text-[10px] text-charcoal-muted mt-0.5">Circle info</p>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
