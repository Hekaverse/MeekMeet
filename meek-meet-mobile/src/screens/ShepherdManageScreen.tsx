import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Calendar,
  Settings,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Loader2,
  MapPin,
  CheckCircle,
  Pencil,
  UserPlus,
  UserMinus,
  Shield,
  BarChart3,
  Users,
  Mail,
  Phone,
  FileText,
  BookOpen as BookOpenIcon,
  Video,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { scheduleMeetingNotifications, cancelMeetingNotifications } from '@/lib/notifications'
import type { Circle, CircleShepherd } from '@/types'

const tabs = [
  { key: 'questions', label: 'Questions', icon: BookOpen },
  { key: 'routine', label: 'Routine', icon: Clock },
  { key: 'meetings', label: 'Meetings', icon: Calendar },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const

type TabKey = (typeof tabs)[number]['key']

interface Question {
  id: string
  content: string
  order_index: number
  is_active: boolean
}

interface Routine {
  id: string
  title: string
  description: string | null
  duration_minutes: number | null
  order_index: number
}

interface Meeting {
  id: string
  circle_id: string
  scheduled_at: string
  duration_minutes: number
  location_name: string | null
  location_address: string | null
  notes: string | null
  is_cancelled: boolean
  rescheduled_at?: string | null
  meeting_type?: 'in_person' | 'digital' | 'hybrid'
  join_url?: string | null
}

export default function ShepherdManageScreen() {
  const { circleId } = useParams<{ circleId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const currentTab = (location.pathname.split('/').pop() as TabKey) || 'questions'

  const [circle, setCircle] = useState<Circle | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!circleId) return
    supabase
      .from('circles')
      .select('*')
      .eq('id', circleId)
      .single()
      .then(({ data }) => {
        setCircle(data)
        setLoading(false)
      })
  }, [circleId])

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
      <div className="px-5 pt-4 pb-3 safe-top sticky top-0 z-10 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <button onClick={() => navigate('/shepherd')} className="p-2 -ml-2 mb-1">
            <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate(`/shepherd/${circleId}/analytics`)}
            className="p-2 -mr-2 text-charcoal-muted hover:text-charcoal transition-colors"
            title="Analytics"
          >
            <BarChart3 className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <h1 className="font-serif text-xl text-charcoal">{circle.name}</h1>
        <p className="text-xs text-charcoal-muted flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" strokeWidth={1.5} />
          {circle.location}
        </p>
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-1 overflow-x-auto no-scrollbar mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = currentTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => navigate(`/shepherd/${circleId}/${tab.key}`)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-midnight text-cream'
                  : 'bg-cream-warm text-charcoal-muted border border-border-soft'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentTab === 'questions' && <QuestionsTab circleId={circleId!} />}
            {currentTab === 'routine' && <RoutineTab circleId={circleId!} />}
            {currentTab === 'meetings' && <MeetingsTab circleId={circleId!} circleName={circle.name} />}
            {currentTab === 'members' && <MembersTab circleId={circleId!} />}
            {currentTab === 'settings' && (
              <SettingsTab circle={circle} saving={saving} setSaving={setSaving} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Questions Tab ──────────────────────────────────

function QuestionsTab({ circleId }: { circleId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQ, setNewQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('circle_questions')
      .select('*')
      .eq('circle_id', circleId)
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setQuestions(data ?? [])
        setLoading(false)
      })
  }, [circleId])

  const add = async () => {
    if (!newQ.trim()) return
    const { data } = await supabase
      .from('circle_questions')
      .insert({ circle_id: circleId, content: newQ.trim(), order_index: questions.length })
      .select()
      .single()
    if (data) setQuestions([...questions, data])
    setNewQ('')
  }

  const remove = async (id: string) => {
    await supabase.from('circle_questions').delete().eq('id', id)
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const toggle = async (id: string) => {
    const q = questions.find((x) => x.id === id)
    if (!q) return
    const next = !q.is_active
    await supabase.from('circle_questions').update({ is_active: next }).eq('id', id)
    setQuestions(questions.map((x) => (x.id === id ? { ...x, is_active: next } : x)))
  }

  const move = (index: number, dir: -1 | 1) => {
    const ni = index + dir
    if (ni < 0 || ni >= questions.length) return
    const arr = [...questions]
    ;[arr[index], arr[ni]] = [arr[ni], arr[index]]
    setQuestions(arr.map((q, i) => ({ ...q, order_index: i })))
  }

  if (loading) return <div className="py-10 text-center text-charcoal-muted text-sm">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="bg-cream-warm rounded-xl border border-border-soft p-4">
        <label className="text-xs text-charcoal-muted uppercase tracking-wider font-medium mb-2 block">
          Add Question
        </label>
        <div className="flex gap-2">
          <input
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="e.g., What are you grateful for today?"
            className="flex-1 px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
          <button
            onClick={add}
            className="px-4 py-2.5 bg-midnight text-cream rounded-xl text-sm active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`bg-cream-warm rounded-xl border p-4 ${q.is_active ? 'border-border-soft' : 'border-border-soft opacity-50'}`}
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-wheat-pale flex items-center justify-center text-xs font-medium text-wheat-dark">
                {i + 1}
              </span>
              <p className="flex-1 text-sm text-charcoal">{q.content}</p>
              <div className="flex items-center gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 disabled:opacity-30">
                  <ArrowUp className="w-3.5 h-3.5 text-charcoal-muted" strokeWidth={1.5} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === questions.length - 1} className="p-1.5 disabled:opacity-30">
                  <ArrowDown className="w-3.5 h-3.5 text-charcoal-muted" strokeWidth={1.5} />
                </button>
                <button onClick={() => toggle(q.id)} className={`p-1.5 ${q.is_active ? 'text-sage' : 'text-charcoal-muted'}`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button onClick={() => remove(q.id)} className="p-1.5 text-charcoal-muted hover:text-terracotta">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Routine Tab ────────────────────────────────────

function RoutineTab({ circleId }: { circleId: string }) {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDur, setNewDur] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('circle_routines')
      .select('*')
      .eq('circle_id', circleId)
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setRoutines(data ?? [])
        setLoading(false)
      })
  }, [circleId])

  const add = async () => {
    if (!newTitle.trim()) return
    const { data } = await supabase
      .from('circle_routines')
      .insert({
        circle_id: circleId,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        duration_minutes: parseInt(newDur) || null,
        order_index: routines.length,
      })
      .select()
      .single()
    if (data) setRoutines([...routines, data])
    setNewTitle('')
    setNewDesc('')
    setNewDur('')
  }

  const remove = async (id: string) => {
    await supabase.from('circle_routines').delete().eq('id', id)
    setRoutines(routines.filter((r) => r.id !== id))
  }

  const move = (index: number, dir: -1 | 1) => {
    const ni = index + dir
    if (ni < 0 || ni >= routines.length) return
    const arr = [...routines]
    ;[arr[index], arr[ni]] = [arr[ni], arr[index]]
    setRoutines(arr.map((r, i) => ({ ...r, order_index: i })))
  }

  const totalMinutes = routines.reduce((s, r) => s + (r.duration_minutes ?? 0), 0)

  if (loading) return <div className="py-10 text-center text-charcoal-muted text-sm">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="bg-cream-warm rounded-xl border border-border-soft p-4 space-y-2">
        <label className="text-xs text-charcoal-muted uppercase tracking-wider font-medium block">
          Add Routine Step
        </label>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Step title"
          className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={newDur}
            onChange={(e) => setNewDur(e.target.value)}
            placeholder="Min"
            className="w-24 px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
          <button
            onClick={add}
            className="px-4 py-2.5 bg-midnight text-cream rounded-xl text-sm active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {totalMinutes > 0 && (
        <p className="text-xs text-charcoal-muted flex items-center gap-1">
          <Clock className="w-3 h-3" strokeWidth={1.5} />
          ~{totalMinutes} minutes total
        </p>
      )}

      <div className="space-y-2">
        {routines.map((r, i) => (
          <div key={r.id} className="bg-cream-warm rounded-xl border border-border-soft p-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-terracotta-pale flex items-center justify-center text-xs font-medium text-terracotta">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">{r.title}</p>
                {r.description && <p className="text-xs text-charcoal-muted mt-0.5">{r.description}</p>}
                {r.duration_minutes && (
                  <p className="text-[10px] text-charcoal-muted mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                    {r.duration_minutes} min
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 disabled:opacity-30">
                  <ArrowUp className="w-3.5 h-3.5 text-charcoal-muted" strokeWidth={1.5} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === routines.length - 1} className="p-1.5 disabled:opacity-30">
                  <ArrowDown className="w-3.5 h-3.5 text-charcoal-muted" strokeWidth={1.5} />
                </button>
                <button onClick={() => remove(r.id)} className="p-1.5 text-charcoal-muted hover:text-terracotta">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Meetings Tab ───────────────────────────────────

function MeetingsTab({ circleId, circleName }: { circleId: string; circleName: string }) {
  const location = useLocation()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('120')
  const [locName, setLocName] = useState('')
  const [locAddr, setLocAddr] = useState('')
  const [notes, setNotes] = useState('')
  const [meetingType, setMeetingType] = useState<'in_person' | 'digital' | 'hybrid'>('in_person')
  const [joinUrl, setJoinUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('meetings')
      .select('*')
      .eq('circle_id', circleId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('scheduled_at', { ascending: true })
      .then(({ data }) => {
        setMeetings(data ?? [])
        setLoading(false)
        // Auto-open edit form if navigated with editMeetingId
        const editId = (location.state as { editMeetingId?: string } | null)?.editMeetingId
        if (editId) {
          const m = data?.find((x) => x.id === editId)
          if (m) startEdit(m)
          // Clear state so refresh doesn't reopen
          window.history.replaceState({}, document.title)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circleId])

  const add = async () => {
    if (!date || !time) return
    const scheduled = new Date(`${date}T${time}`).toISOString()
    const { data } = await supabase
      .from('meetings')
      .insert({
        circle_id: circleId,
        scheduled_at: scheduled,
        duration_minutes: parseInt(duration) || 120,
        location_name: locName.trim() || null,
        location_address: locAddr.trim() || null,
        notes: notes.trim() || null,
        status: 'scheduled',
        meeting_type: meetingType,
        join_url: joinUrl.trim() || null,
      })
      .select()
      .single()
    if (data) {
      setMeetings([...meetings, data])
      await scheduleMeetingNotifications(data.id, scheduled, circleName)
    }
    setDate('')
    setTime('')
    setDuration('120')
    setLocName('')
    setLocAddr('')
    setNotes('')
    setMeetingType('in_person')
    setJoinUrl('')
    setShowForm(false)
  }

  const cancel = async (id: string) => {
    await cancelMeetingNotifications(id)
    await supabase.from('meetings').update({ status: 'cancelled' }).eq('id', id)
    setMeetings(meetings.filter((m) => m.id !== id))
  }

  const startEdit = (m: Meeting) => {
    const d = new Date(m.scheduled_at)
    setDate(d.toISOString().slice(0, 10))
    setTime(d.toTimeString().slice(0, 5))
    setDuration(String(m.duration_minutes))
    setLocName(m.location_name ?? '')
    setLocAddr(m.location_address ?? '')
    setNotes(m.notes ?? '')
    setMeetingType(m.meeting_type ?? 'in_person')
    setJoinUrl(m.join_url ?? '')
    setEditingId(m.id)
    setShowForm(true)
  }

  const saveEdit = async () => {
    if (!editingId || !date || !time) return
    const scheduled = new Date(`${date}T${time}`).toISOString()
    await cancelMeetingNotifications(editingId)
    const { error } = await supabase
      .from('meetings')
      .update({
        scheduled_at: scheduled,
        duration_minutes: parseInt(duration) || 120,
        location_name: locName.trim() || null,
        location_address: locAddr.trim() || null,
        notes: notes.trim() || null,
        meeting_type: meetingType,
        join_url: joinUrl.trim() || null,
        rescheduled_at: new Date().toISOString(),
      })
      .eq('id', editingId)
    if (!error) {
      setMeetings(meetings.map((m) =>
        m.id === editingId
          ? { ...m, scheduled_at: scheduled, duration_minutes: parseInt(duration) || 120, location_name: locName.trim() || null, location_address: locAddr.trim() || null, notes: notes.trim() || null, rescheduled_at: new Date().toISOString() }
          : m
      ))
      await scheduleMeetingNotifications(editingId, scheduled, circleName)
      setEditingId(null)
      setShowForm(false)
      setDate('')
      setTime('')
      setDuration('120')
      setLocName('')
      setLocAddr('')
      setNotes('')
      setMeetingType('in_person')
      setJoinUrl('')
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric' })
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })

  if (loading) return <div className="py-10 text-center text-charcoal-muted text-sm">Loading...</div>

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full py-3 bg-midnight text-cream rounded-xl text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        {showForm ? <X className="w-4 h-4" strokeWidth={1.5} /> : <Plus className="w-4 h-4" strokeWidth={1.5} />}
        {showForm ? 'Cancel' : 'Schedule Meeting'}
      </button>

      {showForm && (
        <div className="bg-cream-warm rounded-xl border border-border-soft p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm" />
          </div>
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (min)" className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm" />

          {/* Meeting Type */}
          <div className="flex gap-2">
            {[
              { key: 'in_person', label: 'In Person' },
              { key: 'digital', label: 'Digital' },
              { key: 'hybrid', label: 'Hybrid' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setMeetingType(t.key as typeof meetingType)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                  meetingType === t.key
                    ? 'bg-midnight text-cream border-midnight'
                    : 'bg-white text-charcoal-muted border-border-soft'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {(meetingType === 'in_person' || meetingType === 'hybrid') && (
            <>
              <input value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="Location name" className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm" />
              <input value={locAddr} onChange={(e) => setLocAddr(e.target.value)} placeholder="Address" className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm" />
            </>
          )}

          {(meetingType === 'digital' || meetingType === 'hybrid') && (
            <input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="Join link (Zoom, Meet...)" className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm" />
          )}

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for attendees..." rows={2} className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm resize-none" />
          <button onClick={editingId ? saveEdit : add} disabled={!date || !time} className="w-full py-2.5 bg-sage text-cream rounded-xl text-sm font-medium disabled:opacity-50">
            {editingId ? 'Save Changes' : 'Schedule'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {meetings.map((m) => (
          <div key={m.id} className="bg-cream-warm rounded-xl border border-border-soft p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-charcoal">{fmtDate(m.scheduled_at)}</p>
                <p className="text-xs text-charcoal-muted">
                  {fmtTime(m.scheduled_at)}
                  {m.duration_minutes ? ` · ${m.duration_minutes} min` : ''}
                </p>
                {m.meeting_type && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${
                    m.meeting_type === 'digital' ? 'bg-sky-pale text-sky-soft' :
                    m.meeting_type === 'hybrid' ? 'bg-wheat-pale text-wheat-dark' :
                    'bg-sage-pale text-sage-dark'
                  }`}>
                    {m.meeting_type === 'in_person' ? 'In Person' : m.meeting_type === 'digital' ? 'Digital' : 'Hybrid'}
                  </span>
                )}
                {m.location_name && <p className="text-xs text-charcoal-muted mt-1">{m.location_name}</p>}
                {m.join_url && (
                  <button
                    onClick={() => window.open(m.join_url!, '_blank')}
                    className="text-xs text-sky-soft flex items-center gap-1 mt-1"
                  >
                    <Video className="w-3 h-3" strokeWidth={1.5} />
                    Open Join Link
                  </button>
                )}
                {m.notes && <p className="text-xs text-charcoal-muted mt-1 italic">{m.notes}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(m)} className="p-1.5 text-charcoal-muted hover:text-midnight">
                  <Pencil className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button onClick={() => cancel(m.id)} className="p-1.5 text-charcoal-muted hover:text-terracotta">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {meetings.length === 0 && (
          <div className="text-center py-10 text-charcoal-muted text-sm">No meetings scheduled.</div>
        )}
      </div>
    </div>
  )
}

// ── Members Tab ────────────────────────────────────

interface MemberProfile {
  user_id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  phone: string | null
  denomination: string | null
  bio: string | null
  testimony: string | null
  rsvp_count: number
}

function MembersTab({ circleId }: { circleId: string }) {
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadMembers()
  }, [circleId])

  const loadMembers = async () => {
    setLoading(true)
    // Get all meetings for this circle
    const { data: meetingsData } = await supabase
      .from('meetings')
      .select('id')
      .eq('circle_id', circleId)

    const meetingIds = (meetingsData ?? []).map((m) => m.id)
    if (meetingIds.length === 0) {
      setMembers([])
      setLoading(false)
      return
    }

    // Get all RSVPs for these meetings, joined with profiles
    const { data: rsvpsData } = await supabase
      .from('rsvps')
      .select(`
        user_id,
        status,
        profile:profiles(id, full_name, avatar_url, phone, denomination, bio, testimony)
      `)
      .in('meeting_id', meetingIds)
      .eq('status', 'going')

    // Deduplicate by user_id and count RSVPs
    const memberMap = new Map<string, MemberProfile & { count: number }>()
    for (const r of (rsvpsData ?? []) as any[]) {
      const profile = r.profile as MemberProfile | null
      const uid = r.user_id as string
      const existing = memberMap.get(uid)
      if (existing) {
        existing.count += 1
      } else {
        memberMap.set(uid, {
          user_id: uid,
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
          avatar_url: profile?.avatar_url ?? null,
          phone: profile?.phone ?? null,
          denomination: profile?.denomination ?? null,
          bio: profile?.bio ?? null,
          testimony: profile?.testimony ?? null,
          rsvp_count: 1,
          count: 1,
        })
      }
    }

    const enriched = Array.from(memberMap.values()).map((m) => ({
      user_id: m.user_id,
      full_name: m.full_name,
      email: m.email,
      avatar_url: m.avatar_url,
      phone: m.phone,
      denomination: m.denomination,
      bio: m.bio,
      testimony: m.testimony,
      rsvp_count: m.count,
    }))

    // Sort by most active
    enriched.sort((a, b) => b.rsvp_count - a.rsvp_count)
    setMembers(enriched)
    setLoading(false)
  }

  const filtered = members.filter((m) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      (m.full_name?.toLowerCase().includes(q) ?? false) ||
      (m.email?.toLowerCase().includes(q) ?? false) ||
      (m.denomination?.toLowerCase().includes(q) ?? false) ||
      (m.bio?.toLowerCase().includes(q) ?? false)
    )
  })

  if (loading) return <div className="py-10 text-center text-charcoal-muted text-sm">Loading members...</div>

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-9 pr-4 py-2.5 bg-cream-warm border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <div className="text-xs text-charcoal-muted font-medium">
        {members.length} member{members.length !== 1 ? 's' : ''} · {members.reduce((sum, m) => sum + m.rsvp_count, 0)} total attendances
      </div>

      <div className="space-y-3">
        {filtered.map((member) => (
          <div
            key={member.user_id}
            className="bg-cream-warm rounded-xl border border-border-soft p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-pale flex items-center justify-center flex-shrink-0 overflow-hidden">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-sage">
                    {(member.full_name ?? member.email ?? '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">
                  {member.full_name || 'Unnamed Member'}
                </p>
                {member.email && (
                  <p className="text-xs text-charcoal-muted flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                    {member.email}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {member.denomination && (
                    <span className="text-[10px] px-2 py-0.5 bg-wheat-pale text-wheat-dark rounded-full font-medium">
                      {member.denomination}
                    </span>
                  )}
                  <span className="text-[10px] text-charcoal-muted">
                    {member.rsvp_count} meet{member.rsvp_count !== 1 ? 's' : ''} attended
                  </span>
                </div>
              </div>
            </div>

            {(member.phone || member.bio || member.testimony) && (
              <div className="space-y-2 pt-2 border-t border-border-soft/60">
                {member.phone && (
                  <p className="text-xs text-charcoal-muted flex items-center gap-1">
                    <Phone className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                    {member.phone}
                  </p>
                )}
                {member.bio && (
                  <p className="text-xs text-charcoal-muted flex items-start gap-1">
                    <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span className="line-clamp-2">{member.bio}</span>
                  </p>
                )}
                {member.testimony && (
                  <p className="text-xs text-charcoal-muted flex items-start gap-1">
                    <BookOpenIcon className="w-3 h-3 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span className="line-clamp-2">{member.testimony}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-charcoal-muted/40 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-charcoal-muted">
              {searchQuery ? 'No members match your search.' : 'No members yet.'}
            </p>
            <p className="text-xs text-charcoal-muted/70 mt-1">
              {searchQuery ? 'Try a different search term.' : 'Members will appear once people RSVP to your meetings.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Settings Tab ───────────────────────────────────

function SettingsTab({
  circle,
  saving,
  setSaving,
}: {
  circle: Circle
  saving: boolean
  setSaving: (v: boolean) => void
}) {
  const [name, setName] = useState(circle.name)
  const [description, setDescription] = useState(circle.description ?? '')
  const [location, setLocation] = useState(circle.location)
  const [meetingPlace, setMeetingPlace] = useState('')
  const [meetingAddress, setMeetingAddress] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(circle.name)
    setDescription(circle.description ?? '')
    setLocation(circle.location)
    supabase
      .from('circles')
      .select('meeting_place, meeting_address')
      .eq('id', circle.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setMeetingPlace(data.meeting_place ?? '')
          setMeetingAddress(data.meeting_address ?? '')
        }
      })
  }, [circle])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('circles')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim(),
        meeting_place: meetingPlace.trim() || null,
        meeting_address: meetingAddress.trim() || null,
      })
      .eq('id', circle.id)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-cream-warm rounded-xl border border-border-soft p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-charcoal-muted uppercase tracking-wider font-medium">Circle Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-charcoal-muted uppercase tracking-wider font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-terracotta" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-charcoal-muted uppercase tracking-wider font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" strokeWidth={1.5} />
            Location
          </label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-charcoal-muted uppercase tracking-wider font-medium">Meeting Place</label>
          <input value={meetingPlace} onChange={(e) => setMeetingPlace(e.target.value)} placeholder="e.g., St. Marks Hall" className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-charcoal-muted uppercase tracking-wider font-medium">Meeting Address</label>
          <input value={meetingAddress} onChange={(e) => setMeetingAddress(e.target.value)} placeholder="Full street address" className="w-full px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta" />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-midnight text-cream rounded-full text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
          ) : null}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <CoShepherdsSection circleId={circle.id} />
    </div>
  )
}

function CoShepherdsSection({ circleId }: { circleId: string }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [shepherds, setShepherds] = useState<CircleShepherd[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const isLead = shepherds.some((s) => s.user_id === user?.id && s.role === 'lead')

  useEffect(() => {
    loadShepherds()
  }, [circleId])

  const loadShepherds = async () => {
    const { data } = await supabase
      .from('circle_shepherds')
      .select(`
        id,
        circle_id,
        user_id,
        role,
        created_at,
        profile:profiles(full_name, email, avatar_url)
      `)
      .eq('circle_id', circleId)
      .order('role', { ascending: false })
    setShepherds((data ?? []) as unknown as CircleShepherd[])
    setLoading(false)
  }

  const invite = async () => {
    if (!inviteEmail.trim() || !isLead) return
    setInviting(true)

    // Find user by email
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail.trim())
      .limit(1)

    if (!profiles || profiles.length === 0) {
      showToast('No user found with that email', 'error')
      setInviting(false)
      return
    }

    const userId = profiles[0].id
    const { error } = await supabase
      .from('circle_shepherds')
      .insert({ circle_id: circleId, user_id: userId, role: 'assistant' })

    if (error) {
      showToast(error.message.includes('duplicate') ? 'User is already a shepherd' : 'Could not invite shepherd', 'error')
    } else {
      showToast('Co-shepherd invited', 'success')
      setInviteEmail('')
      await loadShepherds()
    }
    setInviting(false)
  }

  const removeShepherd = async (shepherdId: string, userId: string) => {
    if (!isLead) return
    if (userId === user?.id) {
      showToast('You cannot remove yourself. Transfer lead first.', 'error')
      return
    }
    const { error } = await supabase
      .from('circle_shepherds')
      .delete()
      .eq('id', shepherdId)
    if (!error) {
      showToast('Shepherd removed', 'success')
      setShepherds(shepherds.filter((s) => s.id !== shepherdId))
    }
  }

  if (loading) return <div className="py-6 text-center text-charcoal-muted text-sm">Loading shepherds...</div>

  return (
    <div className="bg-cream-warm rounded-xl border border-border-soft p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-sage" strokeWidth={1.5} />
        <h3 className="text-sm font-medium text-charcoal">Co-Shepherds</h3>
      </div>

      {isLead && (
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && invite()}
            placeholder="Email address to invite..."
            className="flex-1 px-3 py-2.5 bg-cream border border-border-soft rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
          <button
            onClick={invite}
            disabled={inviting || !inviteEmail.trim()}
            className="px-4 py-2.5 bg-midnight text-cream rounded-xl text-sm active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.5} />
            {inviting ? '...' : 'Invite'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {shepherds.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 bg-cream rounded-xl border border-border-soft p-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-sage-pale flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-sage">
                  {(s.profile?.full_name ?? s.profile?.email ?? '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-charcoal truncate">{s.profile?.full_name || s.profile?.email || 'Unknown'}</p>
                <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${s.role === 'lead' ? 'bg-terracotta-pale text-terracotta' : 'bg-wheat-pale text-wheat-dark'}`}>
                  {s.role}
                </span>
              </div>
            </div>
            {isLead && s.user_id !== user?.id && (
              <button
                onClick={() => removeShepherd(s.id, s.user_id)}
                className="p-1.5 text-charcoal-muted hover:text-terracotta flex-shrink-0"
                title="Remove shepherd"
              >
                <UserMinus className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        ))}
        {shepherds.length === 0 && (
          <p className="text-xs text-charcoal-muted text-center py-2">No shepherds assigned yet.</p>
        )}
      </div>
    </div>
  )
}
