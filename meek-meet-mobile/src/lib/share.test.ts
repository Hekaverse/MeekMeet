import { describe, it, expect } from 'vitest'
import { buildPassageUrl, buildCircleUrl, buildMeetingUrl, parsePassageUrl, WEB_BASE_URL } from './share'

describe('buildPassageUrl', () => {
  it('links to the public website root', () => {
    expect(buildPassageUrl()).toBe('https://meekmeet.com')
  })
})

describe('buildCircleUrl', () => {
  it('links to the circle public page when a slug is given', () => {
    expect(buildCircleUrl('sydney-cbd')).toBe('https://meekmeet.com/circles/sydney-cbd')
  })

  it('falls back to the circles directory without a slug', () => {
    expect(buildCircleUrl()).toBe('https://meekmeet.com/circles')
  })
})

describe('buildMeetingUrl', () => {
  it('links to the public circles directory', () => {
    expect(buildMeetingUrl()).toBe(`${WEB_BASE_URL}/circles`)
  })
})

describe('parsePassageUrl', () => {
  it('parses a passage URL without verse', () => {
    const result = parsePassageUrl('com.meekmeet.app://read/bible/genesis/1')
    expect(result).toEqual({
      tradition: 'bible',
      bookId: 'genesis',
      chapter: 1,
      verse: undefined,
    })
  })

  it('parses a passage URL with verse', () => {
    const result = parsePassageUrl('com.meekmeet.app://read/bible/genesis/1?verse=3')
    expect(result).toEqual({
      tradition: 'bible',
      bookId: 'genesis',
      chapter: 1,
      verse: 3,
    })
  })

  it('returns null for invalid URLs', () => {
    expect(parsePassageUrl('com.meekmeet.app://about')).toBeNull()
    expect(parsePassageUrl('not-a-url')).toBeNull()
    expect(parsePassageUrl('')).toBeNull()
  })

  it('parses mormon tradition', () => {
    const result = parsePassageUrl('com.meekmeet.app://read/mormon/1-nephi/1?verse=1')
    expect(result?.tradition).toBe('mormon')
    expect(result?.bookId).toBe('1-nephi')
  })
})
