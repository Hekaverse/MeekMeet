import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Flame,
  ChevronRight,
  Clock,
  CheckCircle2,
  History,
  Heart,
  Globe,
  Users,
  Sparkles,
  ArrowRight,
  BookMarked,
  Sunrise,
  Compass,
  CalendarDays,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { useToast } from '@/hooks/useToast'
import { getCuratedDailyReading, getWeeklyTheme, getWeeklyDayIndex } from '@/lib/scriptures'
import { hapticSelect } from '@/lib/haptics'
import { SkeletonHero, SkeletonCard } from '@/components/Skeleton'
import type { DailyPassage } from '@/types'

const traditionCards = [
  {
    id: 'bible',
    name: 'The Bible',
    subtitle: 'King James Version',
    icon: BookOpen,
    color: 'bg-sage-pale text-sage-dark',
    accent: 'bg-sage',
    verse: 'In the beginning God created the heaven and the earth.',
    ref: 'Genesis 1:1',
  },
  {
    id: 'quran',
    name: 'The Quran',
    subtitle: 'Pickthall Translation',
    icon: Globe,
    color: 'bg-wheat-pale text-wheat-dark',
    accent: 'bg-wheat',
    verse: 'In the name of Allah, the Beneficent, the Merciful.',
    ref: 'Al-Fatihah 1:1',
  },
  {
    id: 'tanakh',
    name: 'The Tanakh',
    subtitle: 'King James Version',
    icon: Sparkles,
    color: 'bg-sky-pale text-sky-soft',
    accent: 'bg-sky-soft',
    verse: 'The Lord is my shepherd; I shall not want.',
    ref: 'Psalms 23:1',
  },
  {
    id: 'buddhist',
    name: 'The Dhammapada',
    subtitle: 'Müller Translation',
    icon: Heart,
    color: 'bg-terracotta-pale text-terracotta',
    accent: 'bg-terracotta',
    verse: 'All that we are is the result of what we have thought.',
    ref: 'Dhammapada 1:1',
  },
  {
    id: 'mormon',
    name: 'The Book of Mormon',
    subtitle: 'The Church of Jesus Christ',
    icon: BookMarked,
    color: 'bg-amber-50 text-amber-800',
    accent: 'bg-amber-500',
    verse: 'I, Nephi, having been born of goodly parents...',
    ref: '1 Nephi 1:1',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

function getTimeGreeting(): { greeting: string; icon: typeof Sunrise; subtext: string } {
  const hour = new Date().getHours()
  if (hour < 6) return { greeting: 'The night is deep', icon: Sunrise, subtext: 'Even in darkness, wisdom waits' }
  if (hour < 12) return { greeting: 'Good morning', icon: Sunrise, subtext: 'A new day for ancient words' }
  if (hour < 17) return { greeting: 'Good afternoon', icon: Compass, subtext: 'The light is generous now' }
  if (hour < 21) return { greeting: 'Good evening', icon: Heart, subtext: 'Rest and reflection draw near' }
  return { greeting: 'The night is still', icon: Sparkles, subtext: 'Quiet hours for quiet wisdom' }
}

function isNightTime(): boolean {
  const hour = new Date().getHours()
  return hour < 6
}

function getSeasonalGradient(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'from-midnight via-midnight-soft to-midnight'
  if (hour < 10) return 'from-amber-50/40 via-cream to-cream'
  if (hour < 16) return 'from-cream via-cream to-cream'
  if (hour < 20) return 'from-orange-50/30 via-cream to-cream'
  return 'from-indigo-950/10 via-midnight/5 to-cream'
}

export default function HomeScreen() {
  useAuth()
  const { progress, stats, todayRead, history } = useReadingProgress()
  const navigate = useNavigate()
  useToast()
  const [passage, setPassage] = useState<(DailyPassage & { reflection: string; theme: string }) | null>(null)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [weeklyReadDays, setWeeklyReadDays] = useState<boolean[]>([false, false, false, false, false, false, false])

  const greeting = getTimeGreeting()
  const seasonalGradient = getSeasonalGradient()
  const theme = getWeeklyTheme()
  const dayIndex = getWeeklyDayIndex()

  useEffect(() => {
    getCuratedDailyReading()
      .then((reading) => {
        setPassage(reading)
      })
      .catch((err) => {
        console.error('Failed to load daily reading:', err)
      })
      .finally(() => {
        setLoading(false)
      })
    setStreak(stats.currentStreak)

    // Compute weekly progress from reading history
    const days = [false, false, false, false, false, false, false]
    const now = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      if (stats.dailyReads[dStr]) {
        const dow = d.getDay()
        const idx = dow === 0 ? 6 : dow - 1
        days[idx] = true
      }
    }
    setWeeklyReadDays(days)
  }, [stats])

  const handleNav = (path: string) => {
    hapticSelect()
    navigate(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream safe-top">
        <SkeletonHero />
        <div className="mx-5 space-y-4">
          <SkeletonCard />
          <div className="grid grid-cols-2 gap-3">
            <SkeletonCard className="h-40" />
            <SkeletonCard className="h-40" />
          </div>
        </div>
      </div>
    )
  }

  const recentHistory = history.slice(0, 3)
  const weeklyProgress = weeklyReadDays.filter(Boolean).length

  return (
    <div className={`min-h-screen bg-cream safe-top bg-gradient-to-b ${seasonalGradient}`}>
      {/* ── Hero ── */}
      <section className="px-6 pt-6 pb-8 text-center">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="mx-auto w-24 h-24 mb-5"
        >
          <img
            src="/logo.png"
            alt="Meek Meet"
            className="w-full h-full object-contain rounded-full shadow-md"
          />
        </motion.div>

        {/* Matthew 5:5 badge */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 ${isNightTime() ? 'bg-cream/10' : 'bg-wheat-pale/60'}`}
        >
          <BookOpen className={`w-3.5 h-3.5 ${isNightTime() ? 'text-wheat' : 'text-wheat-dark'}`} strokeWidth={1.5} />
          <span className={`text-[10px] tracking-[0.15em] uppercase font-medium ${isNightTime() ? 'text-wheat' : 'text-wheat-dark'}`}>
            Matthew 5:5
          </span>
        </motion.div>

        {/* The statement piece */}
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`font-serif text-[2.75rem] leading-[1.08] mb-4 ${isNightTime() ? 'text-cream' : 'text-charcoal'}`}
        >
          Blessed are
          <br />
          the <span className="italic text-terracotta">meek</span>,
          <br />
          <span className="text-[2.25rem]">for they shall</span>
          <br />
          <span className="text-[2.25rem]">inherit the earth.</span>
        </motion.h1>

        {/* Greeting */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.35 }}
          className={`text-sm max-w-xs mx-auto leading-relaxed flex items-center justify-center gap-2 ${isNightTime() ? 'text-cream/50' : 'text-charcoal-muted'}`}
        >
          <greeting.icon className={`w-4 h-4 ${isNightTime() ? 'text-wheat' : 'text-terracotta'}`} strokeWidth={1.5} />
          {greeting.greeting} — {greeting.subtext}
        </motion.p>
      </section>

      {/* ── Weekly Journey ── */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="mx-5 mb-8 bg-cream-warm rounded-2xl border border-border-soft p-5 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta-pale flex items-center justify-center flex-shrink-0 mt-0.5">
            <CalendarDays className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-medium text-midnight text-base">This Week's Journey</h2>
              <span className="text-xs text-charcoal-muted">{weeklyProgress}/7 days</span>
            </div>
            <p className="text-sm text-charcoal-muted leading-relaxed mb-3">
              {theme.name} — {theme.subtitle}
            </p>

            {/* Day dots */}
            <div className="flex gap-2 mb-3">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      weeklyReadDays[i]
                        ? 'bg-terracotta text-cream'
                        : i === dayIndex
                        ? 'bg-terracotta/10 text-terracotta border-2 border-terracotta/30'
                        : 'bg-white text-charcoal-muted border border-border-soft'
                    }`}
                  >
                    {weeklyReadDays[i] ? <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} /> : label}
                  </div>
                </div>
              ))}
            </div>

            {/* Today's theme verse */}
            {theme.days[dayIndex] && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  handleNav(`/read/${theme.days[dayIndex].tradition}/${theme.days[dayIndex].bookId}/${theme.days[dayIndex].chapter}`)
                }
                className="w-full text-left bg-white rounded-xl border border-border-soft p-3 shadow-sm active:scale-[0.98] transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-terracotta-pale text-terracotta">
                    Day {dayIndex + 1}
                  </span>
                  <span className="text-xs text-charcoal-muted">
                    {theme.days[dayIndex].book} {theme.days[dayIndex].chapter}
                  </span>
                </div>
                <p className="text-sm text-charcoal line-clamp-2 italic">
                  "{theme.days[dayIndex].text}"
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-terracotta font-medium">
                  <span>Continue journey</span>
                  <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </div>
              </motion.button>
            )}
          </div>
        </div>
      </motion.section>

      {/* ── Verse of the Day ── */}
      {passage && (
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-5 mb-8"
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkles className="w-4 h-4 text-wheat-dark" strokeWidth={1.5} />
            <h2 className="text-sm font-medium text-charcoal-muted uppercase tracking-wider">
              Verse of the Day
            </h2>
            <span className="text-[10px] text-charcoal-muted/60 ml-auto">{passage.theme}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNav(`/read/${passage.tradition}/${passage.bookId}/${passage.chapter}`)}
            className="w-full text-left bg-midnight text-cream rounded-2xl p-5 shadow-md active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 bg-cream/10 rounded-full text-xs font-medium uppercase tracking-wider text-wheat">
                {passage.book} {passage.chapter}
              </span>
              {todayRead && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-sage text-cream rounded-full text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                  Read
                </span>
              )}
            </div>
            <p className="font-serif text-lg leading-relaxed mb-3 text-cream/90">
              "{passage.verses[0]?.text}"
            </p>
            {passage.reflection && (
              <p className="text-sm text-cream/50 leading-relaxed mb-3 border-l-2 border-cream/20 pl-3">
                {passage.reflection}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-cream/50">
              <span>Read more</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
          </motion.button>
        </motion.section>
      )}

      {/* ── Sacred Texts ── */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mx-5 mb-8"
      >
        <h2 className="text-sm font-medium text-charcoal-muted uppercase tracking-wider mb-3 px-1">
          Sacred Texts
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {traditionCards.map((t, i) => {
            const Icon = t.icon
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNav(`/read/${t.id}`)}
                className="bg-white rounded-xl border border-border-soft p-4 text-left shadow-sm hover:shadow-md transition-shadow active:scale-[0.97]"
              >
                <div className={`w-10 h-10 rounded-lg ${t.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-base text-midnight mb-0.5">{t.name}</h3>
                <p className="text-xs text-charcoal-muted mb-2">{t.subtitle}</p>
                <p className="text-xs text-charcoal-muted/70 italic leading-relaxed line-clamp-2">
                  "{t.verse}"
                </p>
                <p className="text-xs text-terracotta mt-1.5 font-medium">{t.ref}</p>
              </motion.button>
            )
          })}
        </div>
      </motion.section>

      {/* ── Your Journey ── */}
      {(progress || streak > 0 || recentHistory.length > 0) && (
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mx-5 mb-8"
        >
          <h2 className="text-sm font-medium text-charcoal-muted uppercase tracking-wider mb-3 px-1">
            Your Journey
          </h2>

          <div className="space-y-3">
            {/* Continue Reading */}
            {progress && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  sessionStorage.setItem('mm_continue_reading', '1')
                  handleNav(`/read/${progress.tradition}/${progress.bookId}/${progress.chapter}`)
                }}
                className="w-full bg-cream-warm rounded-xl border border-border-soft p-4 text-left shadow-sm active:scale-[0.98] transition-transform flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-midnight/5 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-midnight/50" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-muted">Continue Reading</p>
                    <p className="font-medium text-base text-midnight">
                      {progress.book} {progress.chapter}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-charcoal-muted" strokeWidth={1.5} />
              </motion.button>
            )}

            {/* Streak */}
            {streak > 0 && (
              <div className="bg-terracotta-pale rounded-xl border border-terracotta/10 p-4 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-base text-midnight">{streak} day streak</p>
                  <p className="text-sm text-charcoal-muted">Keep your light burning</p>
                </div>
              </div>
            )}

            {/* Recently Read */}
            {recentHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <History className="w-3.5 h-3.5 text-charcoal-muted" strokeWidth={1.5} />
                  <p className="text-sm text-charcoal-muted uppercase tracking-wider">
                    Recently Read
                  </p>
                </div>
                {recentHistory.map((entry) => (
                  <motion.button
                    key={entry.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNav(`/read/${entry.tradition}/${entry.bookId}/${entry.chapter}`)}
                    className="w-full bg-white rounded-xl border border-border-soft p-3 text-left shadow-sm active:scale-[0.98] transition-transform flex items-center justify-between"
                  >
                    <div>
                      <p className="text-base text-charcoal">
                        {entry.book} {entry.chapter}
                      </p>
                      <p className="text-sm text-charcoal-muted mt-0.5 capitalize">
                        {entry.tradition}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* ── Community ── */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mx-5 mb-10"
      >
        <div className="bg-midnight text-cream rounded-2xl p-5 relative overflow-hidden shadow-md">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-wheat" strokeWidth={1.5} />
              <h2 className="text-sm font-medium text-wheat uppercase tracking-wider">
                Join the Community
              </h2>
            </div>
            <p className="text-base leading-relaxed text-cream/80 mb-4">
              Gather in circles with others who share your path. Study together,
              grow together, and find fellowship in the shared pursuit of wisdom.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNav('/circles')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-wheat text-midnight rounded-xl text-sm font-medium active:scale-95 transition-transform"
            >
              Find Your Circle
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <div className="text-center pb-8 px-6">
        <p className="text-xs text-charcoal-muted/50">
          Made with love for all who seek.
        </p>
      </div>
    </div>
  )
}
