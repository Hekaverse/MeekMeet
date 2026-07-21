import { useState, useEffect, useCallback } from 'react'
import type { ReadingProgress, Bookmark, ReadingHistoryEntry, ReadingStats, Highlight } from '@/types'
import {
  getReadingProgress,
  saveReadingProgress,
  getBookmarks,
  addBookmark,
  removeBookmark,
  updateBookmarkNote,
  isBookmarked,
  getReadingHistory,
  addReadingHistory,
  getReadingStats,
  recordReadSession,
  isTodayRead,
  hydrateFromSupabase,
  getHighlights,
  addHighlight,
  removeHighlight,
  isHighlighted,
  getTypographySettings,
  saveTypographySettings,
} from '@/lib/reading-storage'

interface UseReadingProgressReturn {
  progress: ReadingProgress | null
  bookmarks: Bookmark[]
  highlights: Highlight[]
  history: ReadingHistoryEntry[]
  stats: ReadingStats
  todayRead: boolean
  hydrated: boolean
  saveProgress: (progress: ReadingProgress) => void
  bookmark: (b: Bookmark) => void
  unbookmark: (id: string) => void
  editNote: (id: string, note: string) => void
  checkBookmarked: (tradition: string, bookId: string, chapter: number, verseStart: number) => boolean
  highlight: (h: Highlight) => void
  removeHighlight: (id: string) => void
  checkHighlighted: (tradition: string, bookId: string, chapter: number, verseStart: number) => Highlight | undefined
  logHistory: (entry: ReadingHistoryEntry) => void
  markRead: (versesCount: number, isDaily: boolean) => ReadingStats
  typography: ReturnType<typeof getTypographySettings>
  saveTypography: (settings: Record<string, unknown>) => void
}

export function useReadingProgress(): UseReadingProgressReturn {
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [history, setHistory] = useState<ReadingHistoryEntry[]>([])
  const [stats, setStats] = useState<ReadingStats>({
    totalDaysRead: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalVersesRead: 0,
    lastReadDate: null,
    dailyReads: {},
  })
  const [todayRead, setTodayRead] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [typography, setTypography] = useState(getTypographySettings())

  // Initial load + Supabase hydration
  useEffect(() => {
    setProgress(getReadingProgress())
    setBookmarks(getBookmarks())
    setHighlights(getHighlights())
    setHistory(getReadingHistory())
    setStats(getReadingStats())
    setTodayRead(isTodayRead())
    setTypography(getTypographySettings())

    hydrateFromSupabase().then(() => {
      setProgress(getReadingProgress())
      setBookmarks(getBookmarks())
      setHighlights(getHighlights())
      setHistory(getReadingHistory())
      setStats(getReadingStats())
      setTodayRead(isTodayRead())
      setHydrated(true)
    })
  }, [])

  const saveProgress = useCallback((p: ReadingProgress) => {
    saveReadingProgress(p)
    setProgress(p)
  }, [])

  const bookmark = useCallback((b: Bookmark) => {
    const next = addBookmark(b)
    setBookmarks(next)
  }, [])

  const unbookmark = useCallback((id: string) => {
    const next = removeBookmark(id)
    setBookmarks(next)
  }, [])

  const editNote = useCallback((id: string, note: string) => {
    const next = updateBookmarkNote(id, note)
    setBookmarks(next)
  }, [])

  const checkBookmarked = useCallback(
    (tradition: string, bookId: string, chapter: number, verseStart: number) =>
      isBookmarked(tradition, bookId, chapter, verseStart),
    []
  )

  const addHighlightCb = useCallback((h: Highlight) => {
    const next = addHighlight(h)
    setHighlights(next)
  }, [])

  const removeHighlightCb = useCallback((id: string) => {
    const next = removeHighlight(id)
    setHighlights(next)
  }, [])

  const checkHighlighted = useCallback(
    (tradition: string, bookId: string, chapter: number, verseStart: number) =>
      isHighlighted(tradition, bookId, chapter, verseStart),
    []
  )

  const saveTypographyCb = useCallback((settings: Record<string, unknown>) => {
    saveTypographySettings(settings)
    setTypography(getTypographySettings())
  }, [])

  const logHistory = useCallback((entry: ReadingHistoryEntry) => {
    const next = addReadingHistory(entry)
    setHistory(next)
  }, [])

  const markRead = useCallback((versesCount: number, isDaily: boolean) => {
    const next = recordReadSession(versesCount, isDaily)
    setStats(next)
    setTodayRead(true)
    return next
  }, [])

  return {
    progress,
    bookmarks,
    highlights,
    history,
    stats,
    todayRead,
    hydrated,
    saveProgress,
    bookmark,
    unbookmark,
    editNote,
    checkBookmarked,
    highlight: addHighlightCb,
    removeHighlight: removeHighlightCb,
    checkHighlighted,
    logHistory,
    markRead,
    typography,
    saveTypography: saveTypographyCb,
  }
}
