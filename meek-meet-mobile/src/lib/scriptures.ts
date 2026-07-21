import type { DailyPassage, Verse, SearchResult } from '@/types'
import { getCuratedDailyVerse } from '@/data/curated-daily'
import { getCurrentWeekTheme, getDayOfWeek } from '@/data/weekly-themes'

const traditionMeta: Record<string, { books: { id: string; name: string; chapters?: number; verses?: number }[] }> = {}

export async function loadTraditionMeta(tradition: string) {
  if (traditionMeta[tradition]) return traditionMeta[tradition]
  try {
    const res = await fetch(`/data/scriptures/${tradition}/meta.json`)
    const data = await res.json()
    traditionMeta[tradition] = data
    return data
  } catch {
    return { books: [] }
  }
}

export async function getChapterCount(tradition: string, bookId: string): Promise<number> {
  const meta = await loadTraditionMeta(tradition)
  const book = meta.books.find((b: any) => b.id === bookId)
  return book?.chapters ?? 1
}

export function isPlaceholderVerse(text: string): boolean {
  return /^\[.*?\d+.*?\]$/.test(text.trim())
}

export async function loadPassage(tradition: string, bookId: string, chapter: number): Promise<DailyPassage | null> {
  try {
    let verses: Verse[] = []
    let bookName = bookId

    if (tradition === 'bible' || tradition === 'tanakh' || tradition === 'mormon') {
      let data: any = null
      // Resolve fetch paths by tradition
      let paths: string[]
      if (tradition === 'tanakh') {
        paths = [`/data/scriptures/tanakh/kjv/${bookId}.json`, `/data/scriptures/bible/kjv/${bookId}.json`]
      } else if (tradition === 'mormon') {
        paths = [`/data/scriptures/mormon/${bookId}.json`]
      } else {
        paths = [`/data/scriptures/bible/kjv/${bookId}.json`]
      }
      for (const path of paths) {
        try {
          const res = await fetch(path)
          if (res.ok) {
            data = await res.json()
            break
          }
        } catch {
          // continue to next path
        }
      }
      if (!data) return null
      bookName = data.book || bookId
      const chapterVerses = data.chapters[String(chapter)] || []
      verses = chapterVerses.map((text: string, i: number) => ({ num: i + 1, text }))
      // Detect placeholder content like "[Psalms 1]"
      if (verses.length === 1 && isPlaceholderVerse(verses[0].text)) {
        return null
      }
    } else if (tradition === 'quran') {
      const res = await fetch(`/data/scriptures/quran/pickthall/${bookId}.json`)
      const data = await res.json()
      bookName = data.name || `Surah ${bookId}`
      verses = data.verses || []
    } else if (tradition === 'buddhist') {
      const res = await fetch(`/data/scriptures/buddhist/dhammapada.json`)
      const data = await res.json()
      bookName = data.book
      const chapterData = data.chapters[String(chapter)]
      verses = chapterData?.verses || []
    }

    return { tradition, bookId, book: bookName, chapter, verses }
  } catch {
    return null
  }
}

export async function getDailyReadingForTradition(tradition: string, dateStr?: string): Promise<DailyPassage | null> {
  const today = dateStr || new Date().toISOString().split('T')[0]
  const hash = dateHash(today)

  const meta = await loadTraditionMeta(tradition)
  const books = meta.books
  if (books.length === 0) return null

  const bookIndex = hash % books.length
  const book = books[bookIndex]
  const maxChapters = book.chapters || 1
  const chapter = (hash % maxChapters) + 1

  const passage = await loadPassage(tradition, book.id, chapter)
  if (passage) {
    return { ...passage, bookId: book.id }
  }

  return null
}

export async function getDailyReadingFromData(dateStr?: string): Promise<DailyPassage> {
  const today = dateStr || new Date().toISOString().split('T')[0]
  const hash = dateHash(today)

  const traditions = ['bible', 'quran', 'tanakh', 'buddhist', 'mormon'] as const
  const tradition = traditions[hash % traditions.length]

  const meta = await loadTraditionMeta(tradition)
  const books = meta.books
  if (books.length === 0) return getFallbackReading(tradition)

  const bookIndex = hash % books.length
  const book = books[bookIndex]
  const maxChapters = book.chapters || 1
  const chapter = (hash % maxChapters) + 1

  const passage = await loadPassage(tradition, book.id, chapter)
  if (passage) {
    // Ensure bookId is present
    return { ...passage, bookId: book.id }
  }

  return getFallbackReading(tradition)
}

export function dateHash(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export async function searchScriptures(query: string, tradition?: string, limit = 50): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  const traditions = tradition ? [tradition] : ['bible', 'quran', 'tanakh', 'buddhist', 'mormon']
  const results: SearchResult[] = []

  for (const t of traditions) {
    const meta = await loadTraditionMeta(t)
    if (!meta.books?.length) continue

    for (const book of meta.books) {
      if (results.length >= limit) break
      const maxChapters = book.chapters || 1

      for (let chapter = 1; chapter <= maxChapters; chapter++) {
        if (results.length >= limit) break
        const passage = await loadPassage(t, book.id, chapter)
        if (!passage || !passage.verses?.length) continue

        for (const v of passage.verses) {
          if (v.text.toLowerCase().includes(q)) {
            results.push({
              tradition: t,
              bookId: book.id,
              book: passage.book,
              chapter,
              verse: v.num,
              text: v.text,
            })
            if (results.length >= limit) break
          }
        }
      }
    }
  }

  return results
}

export async function getCuratedDailyReading(): Promise<DailyPassage & { reflection: string; theme: string }> {
  const curated = getCuratedDailyVerse()
  const passage = await loadPassage(curated.tradition, curated.bookId, curated.chapter)
  if (passage) {
    return {
      ...passage,
      bookId: curated.bookId,
      reflection: curated.reflection,
      theme: curated.theme,
    }
  }
  // Fallback to hardcoded text
  return {
    tradition: curated.tradition,
    bookId: curated.bookId,
    book: curated.book,
    chapter: curated.chapter,
    verses: [{ num: curated.verse, text: curated.text }],
    reflection: curated.reflection,
    theme: curated.theme,
  }
}

export function getWeeklyTheme() {
  return getCurrentWeekTheme()
}

export function getWeeklyDayIndex(): number {
  const dow = getDayOfWeek()
  return dow === 0 ? 6 : dow - 1 // Convert Sun=0 to Mon=0
}

export function getFallbackReading(tradition: string): DailyPassage {
  const fallbacks: Record<string, DailyPassage> = {
    bible: {
      tradition: 'bible',
      bookId: 'genesis',
      book: 'Genesis',
      chapter: 1,
      verses: [
        { num: 1, text: 'In the beginning God created the heaven and the earth.' },
        { num: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep.' },
        { num: 3, text: 'And God said, Let there be light: and there was light.' },
      ],
    },
    quran: {
      tradition: 'quran',
      bookId: '1',
      book: 'Al-Fatihah',
      chapter: 1,
      verses: [
        { num: 1, text: 'In the name of Allah, the Beneficent, the Merciful.' },
        { num: 2, text: 'Praise be to Allah, Lord of the Worlds,' },
        { num: 3, text: 'The Beneficent, the Merciful.' },
      ],
    },
    tanakh: {
      tradition: 'tanakh',
      bookId: 'genesis',
      book: 'Genesis',
      chapter: 1,
      verses: [
        { num: 1, text: 'In the beginning God created the heaven and the earth.' },
        { num: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep.' },
        { num: 3, text: 'And God said: Let there be light. And there was light.' },
      ],
    },
    buddhist: {
      tradition: 'buddhist',
      bookId: 'dhammapada',
      book: 'The Dhammapada',
      chapter: 1,
      verses: [
        { num: 1, text: 'All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts.' },
        { num: 2, text: 'If a man speaks or acts with an evil thought, pain follows him, as the wheel follows the foot of the ox that draws the carriage.' },
      ],
    },
    mormon: {
      tradition: 'mormon',
      bookId: '1_nephi',
      book: '1 Nephi',
      chapter: 1,
      verses: [
        { num: 1, text: 'I, Nephi, having been born of goodly parents, therefore I was taught somewhat in all the learning of my father; and having seen many afflictions in the course of my days, nevertheless, having been highly favored of the Lord in all my days...' },
        { num: 2, text: 'Yea, I make a record in the language of my father, which consists of the learning of the Jews and the language of the Egyptians.' },
        { num: 3, text: 'And I know that the record which I make is true; and I make it with mine own hand; and I make it according to my knowledge.' },
      ],
    },
  }
  return fallbacks[tradition] || fallbacks.bible
}
