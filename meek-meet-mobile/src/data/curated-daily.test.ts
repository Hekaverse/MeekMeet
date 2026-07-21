import { describe, it, expect } from 'vitest'
import { getCuratedDailyVerse, getCuratedVerseForDate } from './curated-daily'

describe('curated-daily', () => {
  it('returns a verse for today', () => {
    const verse = getCuratedDailyVerse()
    expect(verse).toBeDefined()
    expect(verse.tradition).toBeDefined()
    expect(verse.bookId).toBeDefined()
    expect(verse.book).toBeDefined()
    expect(verse.chapter).toBeGreaterThan(0)
    expect(verse.verse).toBeGreaterThan(0)
    expect(verse.text).toBeDefined()
    expect(verse.text.length).toBeGreaterThan(0)
    expect(verse.reflection).toBeDefined()
    expect(verse.theme).toBeDefined()
  })

  it('returns consistent verse for same date', () => {
    const date = new Date(2024, 5, 15) // June 15
    const v1 = getCuratedVerseForDate(date)
    const v2 = getCuratedVerseForDate(date)
    expect(v1.text).toBe(v2.text)
    expect(v1.tradition).toBe(v2.tradition)
  })

  it('cycles through different verses on different dates', () => {
    const d1 = new Date(2024, 0, 1)
    const d2 = new Date(2024, 0, 2)
    const v1 = getCuratedVerseForDate(d1)
    const v2 = getCuratedVerseForDate(d2)
    // Different days should usually give different verses (28 in rotation)
    expect(v1.text).not.toBe(v2.text)
  })

  it('includes all five traditions in the rotation', () => {
    const traditions = new Set<string>()
    for (let i = 0; i < 28; i++) {
      const d = new Date(2024, 0, i + 1)
      traditions.add(getCuratedVerseForDate(d).tradition)
    }
    expect(traditions.has('bible')).toBe(true)
    expect(traditions.has('quran')).toBe(true)
    expect(traditions.has('tanakh')).toBe(true)
    expect(traditions.has('buddhist')).toBe(true)
    expect(traditions.has('mormon')).toBe(true)
  })
})
