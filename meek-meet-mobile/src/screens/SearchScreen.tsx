import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowLeft, BookOpen, X } from 'lucide-react'
import { hapticSelect } from '@/lib/haptics'
import { searchScriptures } from '@/lib/scriptures'
import type { SearchResult } from '@/types'

const traditionLabels: Record<string, string> = {
  bible: 'Bible',
  tanakh: 'Tanakh',
  quran: 'Quran',
  buddhist: 'Dhammapada',
  mormon: 'Book of Mormon',
}

const traditionColors: Record<string, string> = {
  bible: 'bg-emerald-100 text-emerald-800',
  tanakh: 'bg-amber-100 text-amber-800',
  quran: 'bg-sky-100 text-sky-800',
  buddhist: 'bg-rose-100 text-rose-800',
  mormon: 'bg-orange-100 text-orange-800',
}

function highlightText(text: string, query: string) {
  const q = query.toLowerCase()
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + query.length)
  const after = text.slice(idx + query.length)
  return (
    <>
      {before}
      <mark className="bg-terracotta/20 text-midnight rounded px-0.5">{match}</mark>
      {after}
    </>
  )
}

export default function SearchScreen() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    const r = await searchScriptures(q.trim(), undefined, 50)
    setResults(r)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(query), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, performSearch])

  const handleResultTap = (r: SearchResult) => {
    navigate(`/read/${r.tradition}/${r.bookId}/${r.chapter}?verse=${r.verse}`)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-midnight/5 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { hapticSelect(); navigate(-1) }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-midnight/5 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-midnight" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scriptures..."
              className="w-full pl-9 pr-9 py-2.5 bg-white rounded-xl border border-midnight/10 text-midnight placeholder:text-midnight/40 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            {query && (
              <button
                onClick={() => { hapticSelect(); setQuery(''); inputRef.current?.focus() }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-midnight/40" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!searched && !query && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-midnight/5 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-midnight/30" />
            </div>
            <p className="text-midnight/40 text-sm font-medium">Seek, and ye shall find.</p>
            <p className="text-midnight/30 text-sm mt-1">Try words like "love," "light," "patience," or "mercy"</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-midnight/40 text-sm font-medium">The words you seek are moving waters.</p>
            <p className="text-midnight/30 text-sm mt-1">Try a different current — search across all five traditions.</p>
          </div>
        )}

        <AnimatePresence>
          {results.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <p className="text-sm text-midnight/40 mb-3">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((r, i) => (
                <motion.button
                  key={`${r.tradition}-${r.bookId}-${r.chapter}-${r.verse}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  onClick={() => { hapticSelect(); handleResultTap(r) }}
                  className="w-full text-left bg-white rounded-xl p-4 border border-midnight/5 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${traditionColors[r.tradition] || 'bg-midnight/5 text-midnight/60'}`}>
                      {traditionLabels[r.tradition] || r.tradition}
                    </span>
                    <span className="text-sm text-midnight/50">
                      {r.book} {r.chapter}:{r.verse}
                    </span>
                  </div>
                  <p className="text-sm text-midnight/80 leading-relaxed line-clamp-3">
                    {highlightText(r.text, query)}
                  </p>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
