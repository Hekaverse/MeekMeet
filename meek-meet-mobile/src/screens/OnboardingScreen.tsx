import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Sparkles, Users, ChevronRight } from 'lucide-react'
import { hapticSelect, hapticSuccess } from '@/lib/haptics'
import { setOnboarded } from '@/lib/preferences'

const slides = [
  {
    icon: BookOpen,
    title: 'Read',
    description:
      'Five sacred texts, one gentle reader. Discover wisdom across traditions — from the Bible to the Dhammapada, the Quran to the Book of Mormon.',
    color: 'bg-sage-pale text-sage-dark',
    accent: 'bg-sage',
  },
  {
    icon: Sparkles,
    title: 'Reflect',
    description:
      'Curated verses, weekly journeys, and cross-tradition connections that deepen understanding. Every day brings a new reflection.',
    color: 'bg-wheat-pale text-wheat-dark',
    accent: 'bg-wheat',
  },
  {
    icon: Users,
    title: 'Gather',
    description:
      'Join circles in your community. Share intelligence. Build change from within. The meek shall inherit the earth.',
    color: 'bg-terracotta-pale text-terracotta',
    accent: 'bg-terracotta',
  },
]

interface OnboardingScreenProps {
  onComplete: () => void
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const next = () => {
    hapticSelect()
    if (index < slides.length - 1) {
      setDirection(1)
      setIndex((i) => i + 1)
    } else {
      hapticSuccess()
      setOnboarded(true)
      onComplete()
    }
  }

  const current = slides[index]
  const Icon = current.icon
  const isLast = index === slides.length - 1

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-terracotta' : 'w-1.5 bg-border-soft'
            }`}
          />
        ))}
      </div>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xs w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center"
          >
            <div
              className={`w-20 h-20 rounded-2xl ${current.color} flex items-center justify-center mx-auto mb-6`}
            >
              <Icon className="w-9 h-9" strokeWidth={1.5} />
            </div>

            <h2 className="font-serif text-3xl text-midnight mb-4">{current.title}</h2>
            <p className="text-base text-charcoal-muted leading-relaxed">
              {current.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={next}
        className={`w-full max-w-xs py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 mb-8 active:scale-95 transition-transform ${
          isLast
            ? 'bg-terracotta text-cream'
            : 'bg-midnight text-cream'
        }`}
      >
        {isLast ? 'Begin Your Journey' : 'Continue'}
        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
      </motion.button>
    </div>
  )
}
