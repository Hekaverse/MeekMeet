import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shuffle, ArrowRight } from 'lucide-react'
import { hapticSelect } from '@/lib/haptics'
import { getRelatedVerses } from '@/data/cross-references'

interface CrossReferenceProps {
  tradition: string
  bookId: string
  chapter: number
  verse: number
}

const traditionLabels: Record<string, string> = {
  bible: 'Bible',
  quran: 'Quran',
  tanakh: 'Tanakh',
  buddhist: 'Dhammapada',
  mormon: 'Book of Mormon',
}

const traditionColors: Record<string, string> = {
  bible: 'bg-sage-pale text-sage-dark border-sage/20',
  quran: 'bg-wheat-pale text-wheat-dark border-wheat/20',
  tanakh: 'bg-sky-pale text-sky-soft border-sky-soft/20',
  buddhist: 'bg-terracotta-pale text-terracotta border-terracotta/20',
  mormon: 'bg-amber-50 text-amber-800 border-amber-200',
}

export default function CrossReference({ tradition, bookId, chapter, verse }: CrossReferenceProps) {
  const navigate = useNavigate()
  const related = getRelatedVerses(tradition, bookId, chapter, verse)

  if (related.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-10 pt-8 border-t border-border-soft"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shuffle className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
        <h3 className="text-sm font-medium text-charcoal-muted uppercase tracking-wider">
          Related in Other Traditions
        </h3>
      </div>

      <div className="space-y-3">
        {related.map((r, i) => (
          <motion.button
            key={`${r.tradition}-${r.bookId}-${r.chapter}-${r.verse}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              hapticSelect()
              navigate(`/read/${r.tradition}/${r.bookId}/${r.chapter}?verse=${r.verse}`)
            }}
            className="w-full text-left bg-cream-warm rounded-xl border border-border-soft p-4 shadow-sm active:scale-[0.98] transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${traditionColors[r.tradition] || 'bg-midnight/5 text-charcoal-muted border-midnight/10'}`}>
                {traditionLabels[r.tradition] || r.tradition}
              </span>
              <span className="text-xs text-charcoal-muted">
                {r.book} {r.chapter}:{r.verse}
              </span>
            </div>
            <p className="text-sm text-charcoal leading-relaxed line-clamp-2">
              "{r.text}"
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-terracotta font-medium">
              <span>Read this passage</span>
              <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
