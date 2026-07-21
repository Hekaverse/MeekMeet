import type { ReadingProgress, Bookmark, ReadingHistoryEntry, ReadingStats, Highlight } from '@/types'
import { supabase } from './supabase'

const KEYS = {
  progress: 'mm_reading_progress',
  bookmarks: 'mm_bookmarks',
  history: 'mm_reading_history',
  stats: 'mm_reading_stats',
  highlights: 'mm_highlights',
  typography: 'mm_typography_settings',
}

// ── LocalStorage helpers ───────────────────────────

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Reading Progress ───────────────────────────────

export function getReadingProgress(): ReadingProgress | null {
  return get<ReadingProgress | null>(KEYS.progress, null)
}

export function saveReadingProgress(progress: ReadingProgress) {
  set(KEYS.progress, progress)
  syncProgressToSupabase(progress)
}

// ── Bookmarks ──────────────────────────────────────

export function getBookmarks(): Bookmark[] {
  return get<Bookmark[]>(KEYS.bookmarks, [])
}

export function addBookmark(bookmark: Bookmark): Bookmark[] {
  const all = getBookmarks()
  // Prevent duplicates on same verse range
  const exists = all.some(
    (b) =>
      b.tradition === bookmark.tradition &&
      b.bookId === bookmark.bookId &&
      b.chapter === bookmark.chapter &&
      b.verseStart === bookmark.verseStart
  )
  if (exists) return all
  const next = [bookmark, ...all]
  set(KEYS.bookmarks, next)
  syncBookmarksToSupabase(next)
  return next
}

export function removeBookmark(id: string): Bookmark[] {
  const all = getBookmarks().filter((b) => b.id !== id)
  set(KEYS.bookmarks, all)
  syncBookmarksToSupabase(all)
  return all
}

export function updateBookmarkNote(id: string, note: string): Bookmark[] {
  const all = getBookmarks().map((b) => (b.id === id ? { ...b, note } : b))
  set(KEYS.bookmarks, all)
  syncBookmarksToSupabase(all)
  return all
}

export function isBookmarked(
  tradition: string,
  bookId: string,
  chapter: number,
  verseStart: number
): boolean {
  return getBookmarks().some(
    (b) =>
      b.tradition === tradition &&
      b.bookId === bookId &&
      b.chapter === chapter &&
      b.verseStart === verseStart
  )
}

// ── Reading History ────────────────────────────────

export function getReadingHistory(): ReadingHistoryEntry[] {
  return get<ReadingHistoryEntry[]>(KEYS.history, [])
}

export function addReadingHistory(entry: ReadingHistoryEntry): ReadingHistoryEntry[] {
  const all = getReadingHistory()
  // Deduplicate same chapter within last hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const filtered = all.filter(
    (h) =>
      !(
        h.tradition === entry.tradition &&
        h.bookId === entry.bookId &&
        h.chapter === entry.chapter &&
        new Date(h.readAt).getTime() > oneHourAgo
      )
  )
  const next = [entry, ...filtered].slice(0, 100)
  set(KEYS.history, next)
  syncHistoryToSupabase(next)
  return next
}

// ── Reading Stats ──────────────────────────────────

function defaultStats(): ReadingStats {
  return {
    totalDaysRead: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalVersesRead: 0,
    lastReadDate: null,
    dailyReads: {},
  }
}

export function getReadingStats(): ReadingStats {
  return get<ReadingStats>(KEYS.stats, defaultStats())
}

export function recordReadSession(versesCount: number, _isDaily: boolean): ReadingStats {
  const today = new Date().toISOString().split('T')[0]
  const stats = getReadingStats()

  // Mark today as read
  if (!stats.dailyReads[today]) {
    stats.dailyReads[today] = true
    stats.totalDaysRead += 1
  }

  // Update streak
  const lastDate = stats.lastReadDate
  if (lastDate) {
    const last = new Date(lastDate)
    const now = new Date(today)
    const diffDays = Math.floor((+now - +last) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      stats.currentStreak += 1
    } else if (diffDays > 1) {
      stats.currentStreak = 1
    }
    // same day = no streak change
  } else {
    stats.currentStreak = 1
  }

  stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak)
  stats.totalVersesRead += versesCount
  stats.lastReadDate = today

  set(KEYS.stats, stats)
  syncStatsToSupabase(stats)
  return stats
}

export function isTodayRead(): boolean {
  const today = new Date().toISOString().split('T')[0]
  return getReadingStats().dailyReads[today] ?? false
}

// ── Supabase sync (best-effort) ────────────────────

let syncDebounce: ReturnType<typeof setTimeout> | null = null

function debouncedSync(fn: () => void) {
  if (syncDebounce) clearTimeout(syncDebounce)
  syncDebounce = setTimeout(fn, 2000)
}

async function syncProgressToSupabase(progress: ReadingProgress) {
  debouncedSync(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    await supabase
      .from('reading_progress')
      .upsert(
        {
          user_id: data.session.user.id,
          tradition: progress.tradition,
          book_id: progress.bookId,
          book: progress.book,
          chapter: progress.chapter,
          verse: progress.verse,
          updated_at: progress.updatedAt,
        },
        { onConflict: 'user_id' }
      )
  })
}

async function syncBookmarksToSupabase(bookmarks: Bookmark[]) {
  debouncedSync(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    // Simple strategy: delete all user bookmarks, re-insert
    const userId = data.session.user.id
    await supabase.from('bookmarks').delete().eq('user_id', userId)
    if (bookmarks.length > 0) {
      await supabase.from('bookmarks').insert(
        bookmarks.map((b) => ({
          user_id: userId,
          tradition: b.tradition,
          book_id: b.bookId,
          book: b.book,
          chapter: b.chapter,
          verse_start: b.verseStart,
          verse_end: b.verseEnd ?? null,
          note: b.note ?? null,
          created_at: b.createdAt,
        }))
      )
    }
  })
}

async function syncHistoryToSupabase(history: ReadingHistoryEntry[]) {
  debouncedSync(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    const userId = data.session.user.id
    // Upsert last 50 entries
    const recent = history.slice(0, 50)
    await supabase.from('reading_history').upsert(
      recent.map((h) => ({
        user_id: userId,
        tradition: h.tradition,
        book_id: h.bookId,
        book: h.book,
        chapter: h.chapter,
        verses_count: h.versesCount,
        read_at: h.readAt,
        is_daily: h.isDaily,
      })),
      { onConflict: 'user_id,book_id,chapter,read_at' }
    )
  })
}

async function syncStatsToSupabase(stats: ReadingStats) {
  debouncedSync(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    await supabase.from('reading_stats').upsert(
      {
        user_id: data.session.user.id,
        total_days_read: stats.totalDaysRead,
        current_streak: stats.currentStreak,
        longest_streak: stats.longestStreak,
        total_verses_read: stats.totalVersesRead,
        last_read_date: stats.lastReadDate,
        daily_reads: stats.dailyReads,
      },
      { onConflict: 'user_id' }
    )
  })
}

// ── Hydration from Supabase ────────────────────────

// ── Highlights ─────────────────────────────────────

export function getHighlights(): Highlight[] {
  return get<Highlight[]>(KEYS.highlights, [])
}

export function addHighlight(highlight: Highlight): Highlight[] {
  const all = getHighlights()
  // Remove existing highlight on same verse
  const filtered = all.filter(
    (h) =>
      !(
        h.tradition === highlight.tradition &&
        h.bookId === highlight.bookId &&
        h.chapter === highlight.chapter &&
        h.verseStart === highlight.verseStart
      )
  )
  const next = [...filtered, highlight]
  set(KEYS.highlights, next)
  return next
}

export function removeHighlight(id: string): Highlight[] {
  const all = getHighlights().filter((h) => h.id !== id)
  set(KEYS.highlights, all)
  return all
}

export function isHighlighted(
  tradition: string,
  bookId: string,
  chapter: number,
  verseStart: number
): Highlight | undefined {
  return getHighlights().find(
    (h) =>
      h.tradition === tradition &&
      h.bookId === bookId &&
      h.chapter === chapter &&
      h.verseStart === verseStart
  )
}

// ── Typography Settings ──────────────────────────────

export function getTypographySettings() {
  return get(KEYS.typography, {
    preset: 'devotional',
    fontSize: 16,
    lineHeight: 1.75,
    fontFamily: 'system',
    verseNumbers: 'inline',
  })
}

export function saveTypographySettings(settings: Record<string, unknown>) {
  set(KEYS.typography, settings)
}

export async function hydrateFromSupabase(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  if (!data.session) return false

  const userId = data.session.user.id

  const [{ data: progress }, { data: bookmarks }, { data: history }, { data: stats }] =
    await Promise.all([
      supabase.from('reading_progress').select('*').eq('user_id', userId).single(),
      supabase.from('bookmarks').select('*').eq('user_id', userId),
      supabase.from('reading_history').select('*').eq('user_id', userId).order('read_at', { ascending: false }).limit(100),
      supabase.from('reading_stats').select('*').eq('user_id', userId).single(),
    ])

  if (progress) {
    set(KEYS.progress, {
      tradition: progress.tradition,
      bookId: progress.book_id,
      book: progress.book,
      chapter: progress.chapter,
      verse: progress.verse,
      updatedAt: progress.updated_at,
    })
  }

  if (bookmarks && bookmarks.length > 0) {
    set(
      KEYS.bookmarks,
      bookmarks.map((b: any) => ({
        id: b.id ?? crypto.randomUUID(),
        tradition: b.tradition,
        bookId: b.book_id,
        book: b.book,
        chapter: b.chapter,
        verseStart: b.verse_start,
        verseEnd: b.verse_end ?? undefined,
        note: b.note ?? undefined,
        createdAt: b.created_at,
      }))
    )
  }

  if (history && history.length > 0) {
    set(
      KEYS.history,
      history.map((h: any) => ({
        id: h.id ?? crypto.randomUUID(),
        tradition: h.tradition,
        bookId: h.book_id,
        book: h.book,
        chapter: h.chapter,
        versesCount: h.verses_count,
        readAt: h.read_at,
        isDaily: h.is_daily,
      }))
    )
  }

  if (stats) {
    set(KEYS.stats, {
      totalDaysRead: stats.total_days_read,
      currentStreak: stats.current_streak,
      longestStreak: stats.longest_streak,
      totalVersesRead: stats.total_verses_read,
      lastReadDate: stats.last_read_date,
      dailyReads: stats.daily_reads ?? {},
    })
  }

  return true
}
