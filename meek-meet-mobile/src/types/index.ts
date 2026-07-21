export interface Verse {
  num: number
  text: string
}

export interface DailyPassage {
  tradition: string
  bookId: string
  book: string
  chapter: number
  verses: Verse[]
}

export interface ScriptureMeta {
  id: string
  name: string
  testament?: string
  chapters: number
}

export interface TraditionMeta {
  id: string
  name: string
  description: string
  books: ScriptureMeta[]
}

export interface Circle {
  id: string
  slug: string
  name: string
  description: string | null
  location: string
  meeting_place: string | null
  meeting_address: string | null
  image_url: string | null
  shepherd_id: string | null
  is_active: boolean
}

export interface Meeting {
  id: string
  circle_id: string
  scheduled_at: string
  duration_minutes: number
  location_name: string | null
  location_address: string | null
  notes: string | null
  is_cancelled: boolean
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled'
  started_at?: string | null
  rescheduled_at?: string | null
  meeting_type?: 'in_person' | 'digital' | 'hybrid'
  join_url?: string | null
}

export interface CircleShepherd {
  id: string
  circle_id: string
  user_id: string
  role: 'lead' | 'assistant'
  created_at: string
  profile?: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

export interface Rsvp {
  meeting_id: string
  status: 'going' | 'maybe' | 'not_going'
}

// ── Reading Progress ───────────────────────────────

export interface ReadingProgress {
  tradition: string
  bookId: string
  book: string
  chapter: number
  verse: number
  updatedAt: string
}

export interface Bookmark {
  id: string
  tradition: string
  bookId: string
  book: string
  chapter: number
  verseStart: number
  verseEnd?: number
  note?: string
  createdAt: string
}

export interface ReadingHistoryEntry {
  id: string
  tradition: string
  bookId: string
  book: string
  chapter: number
  versesCount: number
  readAt: string
  isDaily: boolean
}

export interface SearchResult {
  tradition: string
  bookId: string
  book: string
  chapter: number
  verse: number
  text: string
}

export interface MeetingTime {
  day: string
  time: string
  label: string
}

export interface ExternalGathering {
  id: string
  name: string
  tradition: string
  denomination: string
  description: string
  location: string
  address: string
  latitude: number
  longitude: number
  website: string
  phone: string
  meetingTimes: MeetingTime[]
  googlePlaceId?: string
  googleRating?: number
  googleRatingCount?: number
}

export interface ReadingStats {
  totalDaysRead: number
  currentStreak: number
  longestStreak: number
  totalVersesRead: number
  lastReadDate: string | null
  dailyReads: Record<string, boolean>
}

// ── Highlights ─────────────────────────────────────

export interface Highlight {
  id: string
  tradition: string
  bookId: string
  book: string
  chapter: number
  verseStart: number
  verseEnd?: number
  color: 'yellow' | 'green' | 'blue' | 'pink'
  createdAt: string
}

// ── Typography ─────────────────────────────────────

export type TypographyPreset = 'scholar' | 'devotional' | 'accessibility' | 'night'

export interface TypographySettings {
  preset: TypographyPreset
  fontSize: number
  lineHeight: number
  fontFamily: string
  verseNumbers: 'inline' | 'margin' | 'hidden'
}

// ── Weekly Themes ──────────────────────────────────

export interface WeeklyThemeDay {
  tradition: string
  bookId: string
  book: string
  chapter: number
  verse: number
  text: string
  reflection: string
}

export interface WeeklyTheme {
  id: string
  name: string
  subtitle: string
  description: string
  color: string
  days: WeeklyThemeDay[]
}

// ── Curated Daily ──────────────────────────────────

export interface CuratedDailyVerse {
  tradition: string
  bookId: string
  book: string
  chapter: number
  verse: number
  text: string
  reflection: string
  theme: string
}

// ── Cross References ───────────────────────────────

export interface CrossRefTarget {
  tradition: string
  bookId: string
  book: string
  chapter: number
  verse: number
  text: string
}

export interface CrossReference {
  fromKey: string // "tradition:bookId:chapter:verse"
  theme: string
  related: CrossRefTarget[]
}
