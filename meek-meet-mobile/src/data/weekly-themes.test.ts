import { describe, it, expect } from 'vitest'
import { weeklyThemes, getCurrentWeekTheme, getDayOfWeek } from './weekly-themes'

describe('weekly-themes', () => {
  it('has at least one theme', () => {
    expect(weeklyThemes.length).toBeGreaterThan(0)
  })

  it('each theme has 7 days', () => {
    for (const theme of weeklyThemes) {
      expect(theme.days.length).toBe(7)
    }
  })

  it('each day has required fields', () => {
    for (const theme of weeklyThemes) {
      for (const day of theme.days) {
        expect(day.tradition).toBeDefined()
        expect(day.bookId).toBeDefined()
        expect(day.book).toBeDefined()
        expect(day.chapter).toBeGreaterThan(0)
        expect(day.verse).toBeGreaterThan(0)
        expect(day.text).toBeDefined()
        expect(day.reflection).toBeDefined()
      }
    }
  })

  it('getCurrentWeekTheme returns a valid theme', () => {
    const theme = getCurrentWeekTheme()
    expect(theme).toBeDefined()
    expect(theme.id).toBeDefined()
    expect(theme.name).toBeDefined()
    expect(theme.days.length).toBe(7)
  })

  it('getDayOfWeek returns 0-6', () => {
    const dow = getDayOfWeek()
    expect(dow).toBeGreaterThanOrEqual(0)
    expect(dow).toBeLessThanOrEqual(6)
  })

  it('themes cover multiple traditions across the week', () => {
    for (const theme of weeklyThemes) {
      const traditions = new Set(theme.days.map((d) => d.tradition))
      expect(traditions.size).toBeGreaterThanOrEqual(3)
    }
  })
})
