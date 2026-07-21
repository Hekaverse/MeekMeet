import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(() => Promise.resolve({ data: { session: null } })) },
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({})),
      delete: vi.fn(() => Promise.resolve({})),
      insert: vi.fn(() => Promise.resolve({})),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve({ data: [] })) })), single: vi.fn(() => Promise.resolve({ data: null })) })) })),
    })),
  },
}))

import {
  getHighlights,
  addHighlight,
  removeHighlight,
  isHighlighted,
  getTypographySettings,
  saveTypographySettings,
} from './reading-storage'

beforeEach(() => {
  localStorage.clear()
})

describe('reading-storage highlights', () => {
  it('returns empty array initially', () => {
    expect(getHighlights()).toEqual([])
  })

  it('adds a highlight', () => {
    const h = {
      id: 'test-1',
      tradition: 'bible',
      bookId: 'genesis',
      book: 'Genesis',
      chapter: 1,
      verseStart: 1,
      color: 'yellow' as const,
      createdAt: new Date().toISOString(),
    }
    const result = addHighlight(h)
    expect(result).toHaveLength(1)
    expect(result[0].color).toBe('yellow')
  })

  it('replaces existing highlight on same verse with different color', () => {
    const h1 = {
      id: 'test-1',
      tradition: 'bible',
      bookId: 'genesis',
      book: 'Genesis',
      chapter: 1,
      verseStart: 1,
      color: 'yellow' as const,
      createdAt: new Date().toISOString(),
    }
    addHighlight(h1)
    const h2 = {
      id: 'test-2',
      tradition: 'bible',
      bookId: 'genesis',
      book: 'Genesis',
      chapter: 1,
      verseStart: 1,
      color: 'blue' as const,
      createdAt: new Date().toISOString(),
    }
    const result = addHighlight(h2)
    expect(result).toHaveLength(1)
    expect(result[0].color).toBe('blue')
  })

  it('allows multiple highlights on different verses', () => {
    addHighlight({
      id: 'h1',
      tradition: 'bible',
      bookId: 'genesis',
      book: 'Genesis',
      chapter: 1,
      verseStart: 1,
      color: 'yellow' as const,
      createdAt: new Date().toISOString(),
    })
    addHighlight({
      id: 'h2',
      tradition: 'bible',
      bookId: 'genesis',
      book: 'Genesis',
      chapter: 1,
      verseStart: 2,
      color: 'green' as const,
      createdAt: new Date().toISOString(),
    })
    expect(getHighlights()).toHaveLength(2)
  })

  it('removes a highlight by id', () => {
    const h = {
      id: 'test-1',
      tradition: 'bible',
      bookId: 'genesis',
      book: 'Genesis',
      chapter: 1,
      verseStart: 1,
      color: 'yellow' as const,
      createdAt: new Date().toISOString(),
    }
    addHighlight(h)
    const result = removeHighlight('test-1')
    expect(result).toHaveLength(0)
  })

  it('isHighlighted returns the highlight if exists', () => {
    const h = {
      id: 'test-1',
      tradition: 'bible',
      bookId: 'genesis',
      book: 'Genesis',
      chapter: 1,
      verseStart: 1,
      color: 'yellow' as const,
      createdAt: new Date().toISOString(),
    }
    addHighlight(h)
    const found = isHighlighted('bible', 'genesis', 1, 1)
    expect(found).toBeDefined()
    expect(found!.color).toBe('yellow')
  })

  it('isHighlighted returns undefined if not exists', () => {
    expect(isHighlighted('bible', 'genesis', 1, 1)).toBeUndefined()
  })
})

describe('reading-storage typography', () => {
  it('returns default settings initially', () => {
    const settings = getTypographySettings()
    expect(settings.preset).toBe('devotional')
    expect(settings.fontSize).toBe(16)
  })

  it('saves and retrieves typography settings', () => {
    saveTypographySettings({
      preset: 'night',
      fontSize: 20,
      lineHeight: 2.0,
    })
    const settings = getTypographySettings()
    expect(settings.preset).toBe('night')
    expect(settings.fontSize).toBe(20)
    expect(settings.lineHeight).toBe(2.0)
  })
})
