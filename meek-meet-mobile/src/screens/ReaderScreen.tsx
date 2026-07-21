import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
  X,
  Share2,
  Search,
  Heart,
  Type,
  RefreshCw,
} from 'lucide-react'
import { loadPassage, getChapterCount, loadTraditionMeta } from '@/lib/scriptures'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { useToast } from '@/hooks/useToast'
import { useNetwork } from '@/hooks/useNetwork'
import { hapticSelect, hapticSuccess, hapticLight } from '@/lib/haptics'
import { Share } from '@capacitor/share'
import { supabase } from '@/lib/supabase'

import CrossReference from '@/components/CrossReference'
import TypographySettings, { presets as typePresets, type TypographyPreset } from '@/components/TypographySettings'
import type { DailyPassage, ScriptureMeta } from '@/types'

export default function ReaderScreen() {
  const { tradition: rawTradition, bookId: paramBookId, chapter: paramChapter } = useParams<{
    tradition: string
    bookId?: string
    chapter?: string
  }>()
  const tradition = rawTradition ?? 'bible'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    progress,
    todayRead,
    saveProgress,
    logHistory,
    markRead,
    typography,
    saveTypography,
    bookmarks,
    bookmark,
    unbookmark,
  } = useReadingProgress()
  const { showToast } = useToast()

  const [passage, setPassage] = useState<DailyPassage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [read, setRead] = useState(false)
  const [maxChapter, setMaxChapter] = useState(1)
  const [showTypeSettings, setShowTypeSettings] = useState(false)
  const [activePreset, setActivePreset] = useState<TypographyPreset>(
    typePresets.find((p) => p.id === typography.preset) || typePresets[1]
  )
  const contentRef = useRef<HTMLDivElement>(null)

  // Book/Chapter picker state
  const [showPicker, setShowPicker] = useState(false)
  const [pickerStep, setPickerStep] = useState<'books' | 'chapters'>('books')
  const [pickerBooks, setPickerBooks] = useState<ScriptureMeta[]>([])
  const [selectedBook, setSelectedBook] = useState<ScriptureMeta | null>(null)
  const [bookList, setBookList] = useState<ScriptureMeta[]>([])
  const [currentBookIndex, setCurrentBookIndex] = useState(-1)

  // Sync active preset with stored typography
  useEffect(() => {
    const stored = typePresets.find((p) => p.id === typography.preset)
    if (stored) setActivePreset(stored)
  }, [typography])

  const handlePresetSelect = useCallback((preset: TypographyPreset) => {
    setActivePreset(preset)
    saveTypography({
      preset: preset.id,
      fontSize: preset.fontSize,
      lineHeight: preset.lineHeight,
      fontFamily: preset.fontFamily,
      verseNumbers: preset.verseNumbers,
    })
    showToast(`${preset.name} style applied`, 'success')
  }, [saveTypography, showToast])

  const { isOnline } = useNetwork()

  // Load passage
  useEffect(() => {
    if (!tradition) return
    async function load() {
      setLoading(true)
      setError(false)
      const meta = await loadTraditionMeta(tradition)
      const books = meta.books || []
      setBookList(books)

      if (paramBookId && paramChapter) {
        const chapterNum = Number(paramChapter)
        const p = await loadPassage(tradition, paramBookId, chapterNum)
        if (p) {
          setPassage(p)
          const chapters = await getChapterCount(tradition, paramBookId)
          setMaxChapter(chapters)
          setCurrentBookIndex(books.findIndex((b: ScriptureMeta) => b.id === paramBookId))
        } else {
          setError(true)
        }
      } else {
        const firstBook = books[0]
        if (firstBook) {
          const p = await loadPassage(tradition, firstBook.id, 1)
          if (p) {
            setPassage(p)
            const chapters = await getChapterCount(tradition, firstBook.id)
            setMaxChapter(chapters)
            setCurrentBookIndex(0)
          } else {
            setError(true)
          }
        } else {
          setError(true)
        }
      }
      setLoading(false)
    }
    load()
  }, [tradition, paramBookId, paramChapter])

  // Offline toast
  useEffect(() => {
    if (!isOnline && !loading) {
      showToast('You are offline. Scripture is still available.', 'info')
    }
  }, [isOnline, loading, showToast])

  const handleRetry = () => {
    hapticSelect()
    setLoading(true)
    setError(false)
    setPassage(null)
    // Trigger reload by temporarily clearing and restoring params
    if (paramBookId && paramChapter) {
      loadPassage(tradition!, paramBookId, Number(paramChapter)).then((p) => {
        if (p) {
          setPassage(p)
          getChapterCount(tradition!, paramBookId).then(setMaxChapter)
          setCurrentBookIndex(bookList.findIndex((b) => b.id === paramBookId))
          setError(false)
        } else {
          setError(true)
        }
        setLoading(false)
      })
    }
  }

  useEffect(() => { setRead(todayRead) }, [todayRead])

  useEffect(() => {
    if (!passage || !contentRef.current) return
    const verseParam = searchParams.get('verse')
    if (verseParam) {
      const v = Number(verseParam)
      const el = contentRef.current.querySelector(`[data-verse="${v}"]`)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150)
      }
      return
    }
    const isContinuing = sessionStorage.getItem('mm_continue_reading') === '1'
    if (
      isContinuing &&
      progress &&
      progress.tradition === passage.tradition &&
      progress.bookId === passage.bookId &&
      progress.chapter === passage.chapter &&
      progress.verse > 1
    ) {
      const el = contentRef.current.querySelector(`[data-verse="${progress.verse}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      sessionStorage.removeItem('mm_continue_reading')
    }
  }, [passage, progress, searchParams])

  const handleShareVerse = useCallback(async (v: { num: number; text: string }) => {
    if (!passage) return
    hapticLight()
    const text = `"${v.text}" — ${passage.book} ${passage.chapter}:${v.num}\n\nShared from Meek Meet 🕊️`
    try {
      await Share.share({
        title: `${passage.book} ${passage.chapter}:${v.num}`,
        text,
        dialogTitle: 'Share this verse',
      })
      hapticSuccess()
    } catch (err: any) {
      // Only suppress user-cancellation; surface real errors
      if (err?.message && !/cancel/i.test(err.message)) {
        showToast('Share failed: ' + err.message, 'error')
      }
    }
  }, [passage, showToast])

  const handleToggleFavorite = useCallback((v: { num: number; text: string }) => {
    if (!passage) return
    const existing = bookmarks.find(
      (b) =>
        b.tradition === passage.tradition &&
        b.bookId === passage.bookId &&
        b.chapter === passage.chapter &&
        b.verseStart === v.num
    )
    if (existing) {
      unbookmark(existing.id)
    } else {
      bookmark({
        id: crypto.randomUUID(),
        tradition: passage.tradition,
        bookId: passage.bookId,
        book: passage.book,
        chapter: passage.chapter,
        verseStart: v.num,
        createdAt: new Date().toISOString(),
      })
      hapticSuccess()
    }
  }, [passage, bookmarks, bookmark, unbookmark])

  const handleMarkRead = useCallback(() => {
    if (!passage || read) return
    hapticSuccess()
    showToast('Marked as read — keep your streak alive!', 'success')
    const stats = markRead(passage.verses.length, true)
    setRead(true)
    logHistory({
      id: crypto.randomUUID(),
      tradition: passage.tradition,
      bookId: passage.bookId,
      book: passage.book,
      chapter: passage.chapter,
      versesCount: passage.verses.length,
      readAt: new Date().toISOString(),
      isDaily: true,
    })
    saveProgress({
      tradition: passage.tradition,
      bookId: passage.bookId,
      book: passage.book,
      chapter: passage.chapter,
      verse: passage.verses.length,
      updatedAt: new Date().toISOString(),
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        supabase.from('user_streaks').upsert(
          {
            user_id: data.session.user.id,
            current_streak: stats.currentStreak,
            longest_streak: stats.longestStreak,
            last_read_date: stats.lastReadDate,
          },
          { onConflict: 'user_id' }
        )
      }
    })
  }, [passage, read, markRead, logHistory, saveProgress])

  const navigateChapter = useCallback(
    async (delta: number) => {
      if (!passage) return
      let nextChapter = passage.chapter + delta
      let nextBookId = passage.bookId

      // For single-chapter books (e.g., Quran surahs), navigate to next/prev book
      if (maxChapter === 1) {
        const meta = await loadTraditionMeta(passage.tradition)
        const bookIndex = meta.books.findIndex((b: any) => b.id === passage.bookId)
        const nextBook = meta.books[bookIndex + delta]
        if (!nextBook) return
        nextBookId = nextBook.id
        nextChapter = 1
      } else if (nextChapter < 1 || nextChapter > maxChapter) {
        return
      }

      hapticLight()
      setLoading(true)
      const next = await loadPassage(passage.tradition, nextBookId, nextChapter)
      if (next) {
        setPassage(next)
        setRead(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        navigate(`/read/${passage.tradition}/${nextBookId}/${nextChapter}`, { replace: true })
        const chapters = await getChapterCount(passage.tradition, nextBookId)
        setMaxChapter(chapters)
      }
      setLoading(false)
    },
    [passage, maxChapter, navigate]
  )

  const handleVerseVisible = useCallback(
    (verseNum: number) => {
      if (!passage) return
      saveProgress({
        tradition: passage.tradition,
        bookId: passage.bookId,
        book: passage.book,
        chapter: passage.chapter,
        verse: verseNum,
        updatedAt: new Date().toISOString(),
      })
    },
    [passage, saveProgress]
  )

  useEffect(() => {
    if (!contentRef.current || !passage) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const verse = Number((entry.target as HTMLElement).dataset.verse)
            if (verse) handleVerseVisible(verse)
          }
        })
      },
      { threshold: 0.5 }
    )
    const verses = contentRef.current.querySelectorAll('[data-verse]')
    verses.forEach((v) => observer.observe(v))
    return () => observer.disconnect()
  }, [passage, handleVerseVisible])

  const openPicker = useCallback(async () => {
    setShowPicker(true)
    setPickerStep('books')
    setSelectedBook(null)
    const meta = await loadTraditionMeta(tradition)
    setPickerBooks(meta.books || [])
  }, [tradition])

  const selectBook = useCallback((book: ScriptureMeta) => {
    setSelectedBook(book)
    setPickerStep('chapters')
  }, [])

  const selectChapter = useCallback(
    async (chapter: number) => {
      if (!selectedBook) return
      hapticSelect()
      setShowPicker(false)
      setLoading(true)
      const p = await loadPassage(tradition, selectedBook.id, chapter)
      if (p) {
        setPassage(p)
        setMaxChapter(selectedBook.chapters || 1)
        setRead(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        navigate(`/read/${tradition}/${selectedBook.id}/${chapter}`, { replace: true })
      }
      setLoading(false)
    },
    [selectedBook, tradition, navigate]
  )

  const t = activePreset

  if (loading) {
    return (
      <div className={`min-h-screen ${t.bg} ${t.text} safe-top flex items-center justify-center`}>
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${t.bg} ${t.text} safe-top flex flex-col items-center justify-center px-6 text-center`}>
        <BookOpen className="w-12 h-12 text-charcoal-muted mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-xl text-midnight mb-2">Unable to load passage</h2>
        <p className="text-sm text-charcoal-muted leading-relaxed mb-6 max-w-xs">
          {isOnline
            ? 'The text could not be loaded. This passage may not be available yet.'
            : 'You appear to be offline. Some passages require a connection on first visit.'}
        </p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-midnight text-cream rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          Try Again
        </button>
        <button
          onClick={() => navigate(-1)}
          className="mt-3 text-sm text-terracotta font-medium"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} safe-top transition-colors duration-500`}>
      {/* Progress bar */}
      {passage && (
        <div className="h-0.5 bg-midnight/5">
          <motion.div
            className="h-full bg-terracotta"
            initial={{ width: '0%' }}
            animate={{ width: `${(passage.verses.length > 0 ? ((progress?.verse || 1) / passage.verses.length) : 0) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className={`sticky top-0 z-10 px-4 py-3 flex items-center justify-between safe-top ${t.bg}/90 backdrop-blur-sm transition-colors duration-500`}>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button onClick={openPicker} className="p-2 active:scale-90 transition-transform">
            <List className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={() => navigate('/search')} className="p-2 active:scale-90 transition-transform">
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button onClick={() => setShowTypeSettings(true)} className="p-2 active:scale-90 transition-transform">
            <Type className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 pb-24">
        {!passage ? (
          <div className="text-center py-20 px-6">
            <BookOpen className={`w-12 h-12 mx-auto mb-4 ${t.text === 'text-[#e8e4dc]' ? 'text-[#e8e4dc]/30' : 'text-charcoal-muted'}`} strokeWidth={1.5} />
            <p className={`font-medium mb-2 ${t.text}`}>This chapter isn't available yet</p>
            <p className={`text-sm mb-6 ${t.text === 'text-[#e8e4dc]' ? 'text-[#e8e4dc]/50' : 'text-charcoal-muted'}`}>
              We're still preparing this text. Try another book or check back soon.
            </p>
            <button
              onClick={openPicker}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-midnight text-cream rounded-full text-sm font-medium active:scale-95 transition-transform"
            >
              <List className="w-4 h-4" strokeWidth={1.5} />
              Browse Books
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <span className={`text-sm uppercase tracking-wider ${t.verseNum} font-medium`}>
                {tradition}
              </span>
              <h1 className="font-serif text-2xl mt-1" style={{ fontFamily: t.fontFamily }}>
                {passage.book} {passage.chapter}
              </h1>
            </div>

            <div ref={contentRef} className="space-y-6">
              {passage.verses.map((v) => {
                const isMargin = t.verseNumbers === 'margin'
                const isHidden = t.verseNumbers === 'hidden'
                const verseNumClass = isMargin
                  ? 'absolute left-0 top-1 -translate-x-full pr-3 text-right w-8 text-[10px] font-medium'
                  : isHidden
                  ? 'hidden'
                  : 'text-xs font-medium align-super mr-1.5'
                const paddingClass = isMargin ? 'pl-12' : 'pl-0'
                const isFav = bookmarks.some(
                  (b) =>
                    b.tradition === passage.tradition &&
                    b.bookId === passage.bookId &&
                    b.chapter === passage.chapter &&
                    b.verseStart === v.num
                )

                return (
                  <div
                    key={v.num}
                    data-verse={v.num}
                    className={`group relative ${paddingClass}`}
                  >
                    <p
                      className="leading-relaxed py-2 rounded-lg transition-colors"
                      style={{ fontSize: `${t.fontSize}px`, lineHeight: t.lineHeight, fontFamily: t.fontFamily }}
                    >
                      <span className={`${t.verseNum} ${verseNumClass}`}>
                        {v.num}
                      </span>
                      {v.text}
                    </p>

                    {/* Verse actions: Favorite + Share */}
                    <div className="flex items-center gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleFavorite(v)}
                        className="p-1.5 rounded-lg hover:bg-black/5 active:scale-90 transition-transform"
                        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? 'text-terracotta fill-terracotta' : 'text-charcoal-muted'}`}
                          strokeWidth={1.5}
                        />
                      </button>
                      <button
                        onClick={() => handleShareVerse(v)}
                        className="p-1.5 rounded-lg hover:bg-black/5 active:scale-90 transition-transform"
                        aria-label="Share verse"
                      >
                        <Share2 className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cross References */}
            {passage.verses.length > 0 && (
              <CrossReference
                tradition={passage.tradition}
                bookId={passage.bookId}
                chapter={passage.chapter}
                verse={1}
              />
            )}

            {/* Chapter Navigation */}
            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={() => navigateChapter(-1)}
                disabled={maxChapter === 1 ? currentBookIndex <= 0 : passage.chapter <= 1}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm border border-border-soft disabled:opacity-30 active:scale-95 transition-transform`}
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                Prev
              </button>

              <button
                onClick={openPicker}
                className="text-sm text-charcoal-muted px-3 py-1 rounded-full border border-border-soft hover:bg-cream-warm transition-colors"
              >
                {maxChapter === 1
                  ? `${passage.book} ${currentBookIndex + 1}/${bookList.length}`
                  : `Chapter ${passage.chapter} of ${maxChapter}`}
              </button>

              <button
                onClick={() => navigateChapter(1)}
                disabled={maxChapter === 1 ? currentBookIndex >= bookList.length - 1 : passage.chapter >= maxChapter}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm border border-border-soft disabled:opacity-30 active:scale-95 transition-transform`}
              >
                Next
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Mark as Read */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleMarkRead}
                disabled={read}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  read ? 'bg-sage text-cream' : 'bg-midnight text-cream active:scale-95'
                }`}
              >
                {read ? (
                  <>
                    <Check className="w-4 h-4" strokeWidth={1.5} />
                    Read Today
                  </>
                ) : (
                  'Mark as Read'
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Typography Settings Modal */}
      <AnimatePresence>
        {showTypeSettings && (
          <TypographySettings
            currentPreset={activePreset.id}
            onSelect={handlePresetSelect}
            onClose={() => setShowTypeSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* Book/Chapter Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg max-h-[80vh] ${t.bg} rounded-t-3xl sm:rounded-3xl border border-border-soft flex flex-col`}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b border-border-soft`}>
                <div className="flex items-center gap-2">
                  {pickerStep === 'chapters' && (
                    <button
                      onClick={() => setPickerStep('books')}
                      className="p-1 -ml-1 rounded-full hover:bg-black/5 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  )}
                  <h3 className="font-medium text-sm">
                    {pickerStep === 'books' ? 'Select Book' : selectedBook?.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowPicker(false)}
                  className="p-1 rounded-full hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="overflow-y-auto p-5">
                {pickerStep === 'books' ? (
                  <div className="space-y-1">
                    {pickerBooks.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => selectBook(book)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
                          passage?.bookId === book.id ? 'bg-terracotta-pale' : 'hover:bg-cream-warm'
                        }`}
                      >
                        <span className="text-sm font-medium">{book.name}</span>
                        <ChevronRight className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: selectedBook?.chapters || 0 }, (_, i) => i + 1).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => selectChapter(ch)}
                        className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                          passage?.bookId === selectedBook?.id && passage?.chapter === ch
                            ? 'bg-terracotta text-cream'
                            : 'bg-cream-warm hover:bg-terracotta-pale text-charcoal'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
