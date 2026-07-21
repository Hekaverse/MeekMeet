import { describe, it, expect } from 'vitest'
import { getCrossReferences, getRelatedVerses } from './cross-references'

describe('cross-references', () => {
  it('finds related verses for Genesis 1:1', () => {
    const ref = getCrossReferences('bible', 'genesis', 1, 1)
    expect(ref).not.toBeNull()
    expect(ref!.theme).toBe('Creation')
    expect(ref!.related.length).toBeGreaterThan(0)
    // Should include Quran and Buddhist references
    const traditions = ref!.related.map((r) => r.tradition)
    expect(traditions).toContain('quran')
    expect(traditions).toContain('buddhist')
  })

  it('finds related verses for Matthew 5:44 (Love Your Enemy)', () => {
    const ref = getCrossReferences('bible', 'matthew', 5, 44)
    expect(ref).not.toBeNull()
    expect(ref!.theme).toBe('Love Your Enemy')
    const traditions = ref!.related.map((r) => r.tradition)
    expect(traditions).toContain('quran')
    expect(traditions).toContain('buddhist')
  })

  it('returns null for unmapped verses', () => {
    const ref = getCrossReferences('bible', 'somebook', 99, 99)
    expect(ref).toBeNull()
  })

  it('getRelatedVerses filters out same tradition', () => {
    const related = getRelatedVerses('bible', 'genesis', 1, 1)
    const traditions = related.map((r) => r.tradition)
    expect(traditions).not.toContain('bible')
    expect(traditions).not.toContain('tanakh')
  })

  it('getRelatedVerses returns empty array for unmapped verses', () => {
    const related = getRelatedVerses('mormon', 'unknown', 1, 1)
    expect(related).toEqual([])
  })

  it('each related verse has required fields', () => {
    const ref = getCrossReferences('bible', 'matthew', 5, 44)
    expect(ref).not.toBeNull()
    for (const r of ref!.related) {
      expect(r.tradition).toBeDefined()
      expect(r.bookId).toBeDefined()
      expect(r.book).toBeDefined()
      expect(r.chapter).toBeGreaterThan(0)
      expect(r.verse).toBeGreaterThan(0)
      expect(r.text).toBeDefined()
      expect(r.text.length).toBeGreaterThan(0)
    }
  })
})
