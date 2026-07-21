import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, Trash2, StickyNote, X } from 'lucide-react'
import { useReadingProgress } from '@/hooks/useReadingProgress'

export default function BookmarksScreen() {
  const navigate = useNavigate()
  const { bookmarks, unbookmark, editNote } = useReadingProgress()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const traditionLabels: Record<string, string> = {
    bible: 'Bible',
    quran: 'Quran',
    tanakh: 'Tanakh',
    buddhist: 'Dhammapada',
    mormon: 'Book of Mormon',
  }

  const handleSaveNote = (id: string) => {
    editNote(id, noteDraft)
    setExpandedId(null)
    setNoteDraft('')
  }

  return (
    <div className="min-h-screen px-5 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6 safe-top">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-xl text-charcoal">Favorites</h1>
        <span className="ml-auto text-sm text-charcoal-muted">{bookmarks.length} saved</span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 px-6">
          <Heart className="w-12 h-12 text-charcoal-muted mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-charcoal font-medium text-base mb-2">Treasure up the word.</p>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Verses you favorite will gather here like light in a lantern.
            Tap the heart icon on any verse to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {bookmarks.map((b) => (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-cream-warm rounded-xl border border-border-soft overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => navigate(`/read/${b.tradition}/${b.bookId}/${b.chapter}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-terracotta font-medium uppercase tracking-wider mb-1">
                        {traditionLabels[b.tradition] ?? b.tradition}
                      </p>
                      <p className="font-medium text-charcoal">
                        {b.book} {b.chapter}
                        {b.verseEnd
                          ? `:${b.verseStart}-${b.verseEnd}`
                          : `:${b.verseStart}`}
                      </p>
                      {b.note && (
                        <p className="text-sm text-charcoal-muted mt-1.5 flex items-start gap-1.5">
                          <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                          {b.note}
                        </p>
                      )}
                      <p className="text-xs text-charcoal-muted mt-2">
                        {new Date(b.createdAt).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedId(expandedId === b.id ? null : b.id)
                          setNoteDraft(b.note ?? '')
                        }}
                        className="p-2 rounded-full hover:bg-terracotta-pale transition-colors"
                      >
                        <StickyNote
                          className={`w-4 h-4 ${b.note ? 'text-terracotta' : 'text-charcoal-muted'}`}
                          strokeWidth={1.5}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          unbookmark(b.id)
                        }}
                        className="p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Note editor */}
                <AnimatePresence>
                  {expandedId === b.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-border-soft">
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Add a personal note..."
                          className="w-full h-20 p-3 rounded-xl text-sm bg-cream border border-border-soft resize-none focus:outline-none focus:ring-1 focus:ring-terracotta"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => setExpandedId(null)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-border-soft text-charcoal-muted"
                          >
                            <X className="w-3 h-3" strokeWidth={1.5} />
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(b.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-terracotta text-cream font-medium"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
