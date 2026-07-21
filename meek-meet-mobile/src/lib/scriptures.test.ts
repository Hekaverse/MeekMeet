import { describe, it, expect } from 'vitest'
import { isPlaceholderVerse, dateHash, getFallbackReading } from './scriptures'

describe('scripture utilities', () => {
  it('detects placeholder verses', () => {
    expect(isPlaceholderVerse('[Psalms 1]')).toBe(true)
    expect(isPlaceholderVerse('[Genesis 1]')).toBe(true)
    expect(isPlaceholderVerse('In the beginning God created')).toBe(false)
    expect(isPlaceholderVerse('  [Exodus 1]  ')).toBe(true)
  })

  it('produces deterministic date hashes', () => {
    const h1 = dateHash('2025-01-01')
    const h2 = dateHash('2025-01-01')
    const h3 = dateHash('2025-01-02')
    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
  })

  it('returns fallback readings for known traditions', () => {
    const bible = getFallbackReading('bible')
    expect(bible.book).toBe('Genesis')
    expect(bible.verses.length).toBeGreaterThan(0)

    const quran = getFallbackReading('quran')
    expect(quran.book).toBe('Al-Fatihah')

    const tanakh = getFallbackReading('tanakh')
    expect(tanakh.book).toBe('Genesis')

    const buddhist = getFallbackReading('buddhist')
    expect(buddhist.book).toBe('The Dhammapada')

    const mormon = getFallbackReading('mormon')
    expect(mormon.book).toBe('1 Nephi')
    expect(mormon.tradition).toBe('mormon')
  })

  it('defaults to bible fallback for unknown traditions', () => {
    const fallback = getFallbackReading('unknown')
    expect(fallback.tradition).toBe('bible')
  })
})
