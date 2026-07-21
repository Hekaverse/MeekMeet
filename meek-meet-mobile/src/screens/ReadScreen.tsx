import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Cross, Moon, Star, Flower2, ChevronRight, Search, BookMarked } from 'lucide-react'
import { hapticSelect } from '@/lib/haptics'
import { getDailyReadingFromData } from '@/lib/scriptures'
import type { DailyPassage } from '@/types'

const traditions = [
  {
    id: 'bible',
    name: 'The Bible',
    subtitle: 'King James Version',
    description: 'The sacred scripture of Christianity',
    icon: Cross,
    color: 'bg-sage-pale text-sage-dark',
    accent: 'bg-sage',
  },
  {
    id: 'quran',
    name: 'The Quran',
    subtitle: 'Pickthall Translation',
    description: 'The holy book of Islam',
    icon: Moon,
    color: 'bg-wheat-pale text-wheat-dark',
    accent: 'bg-wheat',
  },
  {
    id: 'tanakh',
    name: 'The Tanakh',
    subtitle: 'King James Version',
    description: 'The Hebrew Bible',
    icon: Star,
    color: 'bg-sky-pale text-sky-soft',
    accent: 'bg-sky-soft',
  },
  {
    id: 'buddhist',
    name: 'The Dhammapada',
    subtitle: 'Müller Translation',
    description: 'The path of Buddhist teaching',
    icon: Flower2,
    color: 'bg-terracotta-pale text-terracotta',
    accent: 'bg-terracotta',
  },
  {
    id: 'mormon',
    name: 'The Book of Mormon',
    subtitle: 'The Church of Jesus Christ',
    description: 'Another testament of Jesus Christ',
    icon: BookMarked,
    color: 'bg-amber-50 text-amber-800',
    accent: 'bg-amber-500',
  },
]

function StartReadingButton() {
  const navigate = useNavigate()
  const [today, setToday] = useState<DailyPassage | null>(null)

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    getDailyReadingFromData(todayStr).then(setToday)
  }, [])

  if (!today) {
    return (
      <button className="w-full mt-6 py-4 bg-midnight/50 text-cream rounded-2xl font-medium text-sm flex items-center justify-center gap-2">
        <BookOpen className="w-4 h-4" strokeWidth={1.5} />
        Loading...
      </button>
    )
  }

  return (
    <button
      onClick={() => { hapticSelect(); navigate(`/read/${today.tradition}`) }}
      className="w-full mt-6 py-4 bg-midnight text-cream rounded-2xl font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
    >
      <BookOpen className="w-4 h-4" strokeWidth={1.5} />
      Today's Reading — {today.book} {today.chapter}
    </button>
  )
}

export default function ReadScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen px-5 pt-6 pb-8 safe-top">
      <div className="flex items-start justify-between mb-2">
        <h1 className="font-serif text-2xl text-charcoal">Scriptures</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { hapticSelect(); navigate('/search') }}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-midnight/5 active:scale-95 transition-transform"
        >
          <Search className="w-5 h-5 text-midnight" strokeWidth={1.5} />
        </motion.button>
      </div>
      <p className="text-sm text-charcoal-muted mb-6">
        Read from any tradition, every day.
      </p>

      <div className="space-y-4">
        {traditions.map((t, i) => {
          const Icon = t.icon
          return (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => { hapticSelect(); navigate(`/read/${t.id}`) }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-cream-warm rounded-2xl border border-border-soft p-5 text-left shadow-sm active:scale-[0.98] transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${t.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="font-medium text-charcoal">{t.name}</h2>
                    <p className="text-sm text-charcoal-muted mt-0.5">{t.subtitle}</p>
                    <p className="text-sm text-charcoal-muted mt-1">{t.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-charcoal-muted mt-1" strokeWidth={1.5} />
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Today's Reading CTA */}
      <StartReadingButton />
    </div>
  )
}
