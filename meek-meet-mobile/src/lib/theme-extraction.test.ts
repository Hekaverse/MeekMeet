import { describe, it, expect } from 'vitest'
import { extractThemes, calculateThreshold } from './theme-extraction'

describe('extractThemes', () => {
  it('extracts top words from responses', () => {
    const texts = [
      'The community needs better parks and gardens for families.',
      'Families want more green spaces and parks in the community.',
      'Better parks would help families and children play safely.',
    ]
    const result = extractThemes(texts)

    expect(result.topWords.length).toBeGreaterThan(0)
    expect(result.topWords[0].word).toBe('parks')
    expect(result.topWords[0].count).toBe(3)
    expect(result.totalWords).toBeGreaterThan(0)
    expect(result.uniqueWords).toBeGreaterThan(0)
  })

  it('filters out stop words', () => {
    const texts = ['The and is was were be been being to of']
    const result = extractThemes(texts)

    expect(result.topWords.length).toBe(0)
    expect(result.totalWords).toBe(0)
  })

  it('filters out short words', () => {
    const texts = ['a an is it of on']
    const result = extractThemes(texts)

    expect(result.topWords.length).toBe(0)
  })

  it('handles empty input', () => {
    const result = extractThemes([])

    expect(result.topWords).toEqual([])
    expect(result.totalWords).toBe(0)
    expect(result.uniqueWords).toBe(0)
  })

  it('limits top words to 10', () => {
    const texts = Array.from({ length: 20 }, (_, i) => `word${i} word${i} unique`)
    const result = extractThemes(texts)

    expect(result.topWords.length).toBeLessThanOrEqual(10)
  })

  it('normalises case', () => {
    const texts = ['PARKS are great', 'parks are needed', 'Parks help families']
    const result = extractThemes(texts)

    const parksEntry = result.topWords.find((w) => w.word === 'parks')
    expect(parksEntry?.count).toBe(3)
  })
})

describe('calculateThreshold', () => {
  it('reaches threshold at 60%', () => {
    expect(calculateThreshold(6, 10)).toEqual({ percentage: 60, reached: true })
  })

  it('does not reach threshold below 60%', () => {
    expect(calculateThreshold(5, 10)).toEqual({ percentage: 50, reached: false })
  })

  it('handles zero attendees', () => {
    expect(calculateThreshold(5, 0)).toEqual({ percentage: 0, reached: false })
  })

  it('handles 100%', () => {
    expect(calculateThreshold(10, 10)).toEqual({ percentage: 100, reached: true })
  })

  it('rounds percentage', () => {
    expect(calculateThreshold(2, 3)).toEqual({ percentage: 67, reached: true })
  })
})
