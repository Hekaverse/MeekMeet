import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Type, Eye, BookOpen, Accessibility, Moon } from 'lucide-react'
import { hapticSelect } from '@/lib/haptics'

export interface TypographyPreset {
  id: string
  name: string
  description: string
  icon: React.ElementType
  fontSize: number
  lineHeight: number
  fontFamily: string
  verseNumbers: 'inline' | 'margin' | 'hidden'
  bg: string
  text: string
  verseNum: string
}

export const presets: TypographyPreset[] = [
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Classic serif, tight leading, inline verse numbers',
    icon: BookOpen,
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: 'Georgia, "Times New Roman", serif',
    verseNumbers: 'inline',
    bg: 'bg-cream',
    text: 'text-charcoal',
    verseNum: 'text-terracotta',
  },
  {
    id: 'devotional',
    name: 'Devotional',
    description: 'Generous spacing, warm and readable',
    icon: Eye,
    fontSize: 18,
    lineHeight: 1.9,
    fontFamily: 'Inter, system-ui, sans-serif',
    verseNumbers: 'margin',
    bg: 'bg-cream',
    text: 'text-charcoal',
    verseNum: 'text-charcoal-muted',
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    description: 'Large text, high contrast, spacious lines',
    icon: Accessibility,
    fontSize: 22,
    lineHeight: 2.0,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    verseNumbers: 'inline',
    bg: 'bg-white',
    text: 'text-black',
    verseNum: 'text-amber-700',
  },
  {
    id: 'night',
    name: 'Night',
    description: 'True dark mode for evening reading',
    icon: Moon,
    fontSize: 17,
    lineHeight: 1.85,
    fontFamily: 'Inter, system-ui, sans-serif',
    verseNumbers: 'margin',
    bg: 'bg-[#0a0a0f]',
    text: 'text-[#e8e4dc]',
    verseNum: 'text-[#c9a96e]',
  },
]

interface TypographySettingsProps {
  currentPreset: string
  onSelect: (preset: TypographyPreset) => void
  onClose: () => void
}

export default function TypographySettings({ currentPreset, onSelect, onClose }: TypographySettingsProps) {
  const [selected, setSelected] = useState(currentPreset)

  useEffect(() => {
    setSelected(currentPreset)
  }, [currentPreset])

  const handleSelect = (preset: TypographyPreset) => {
    hapticSelect()
    setSelected(preset.id)
    onSelect(preset)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-cream rounded-2xl border border-border-soft shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
              <h3 className="font-medium text-midnight text-sm">Reading Style</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-midnight/5 transition-colors">
              <X className="w-5 h-5 text-charcoal-muted" strokeWidth={1.5} />
            </button>
          </div>

          {/* Presets */}
          <div className="p-5 space-y-3">
            {presets.map((preset) => {
              const Icon = preset.icon
              const isActive = selected === preset.id
              return (
                <motion.button
                  key={preset.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(preset)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    isActive
                      ? 'border-terracotta bg-terracotta-pale/50'
                      : 'border-border-soft bg-white hover:bg-cream-warm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-terracotta text-cream' : 'bg-cream-warm text-charcoal-muted'
                    }`}>
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium text-sm ${isActive ? 'text-terracotta' : 'text-midnight'}`}>
                          {preset.name}
                        </h4>
                        {isActive && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 bg-terracotta text-cream rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal-muted mt-0.5">{preset.description}</p>
                      {/* Mini preview */}
                      <div className={`mt-2 px-3 py-2 rounded-lg text-xs leading-relaxed ${preset.bg} ${preset.text}`}>
                        <span className={`text-[10px] font-medium mr-1 ${preset.verseNum}`}>1</span>
                        In the beginning was the Word...
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Font size slider */}
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-charcoal-muted">Font Size</span>
              <span className="text-xs text-charcoal-muted">
                {presets.find((p) => p.id === selected)?.fontSize}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-charcoal-muted">A</span>
              <div className="flex-1 h-2 bg-cream-warm rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-terracotta rounded-full"
                  animate={{
                    width: `${((presets.find((p) => p.id === selected)?.fontSize || 16) - 14) / (24 - 14) * 100}%`,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <span className="text-base text-charcoal-muted">A</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
