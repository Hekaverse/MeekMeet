import { describe, it, expect, beforeEach } from 'vitest'
import { haversineDistance, formatDistance, getStoredLocation, saveLocation, clearLocation } from './location'

describe('location utilities', () => {
  beforeEach(async () => {
    await clearLocation()
    localStorage.clear()
  })

  it('calculates haversine distance correctly', () => {
    // Sydney to Melbourne approx 713km
    const d = haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631)
    expect(d).toBeGreaterThan(700)
    expect(d).toBeLessThan(750)
  })

  it('returns 0 for same point', () => {
    const d = haversineDistance(0, 0, 0, 0)
    expect(d).toBe(0)
  })

  it('formats distance in meters when under 1km', () => {
    expect(formatDistance(0.5)).toBe('500 m')
    expect(formatDistance(0.1)).toBe('100 m')
    expect(formatDistance(0.999)).toBe('999 m')
  })

  it('formats distance with one decimal when under 10km', () => {
    expect(formatDistance(5.3)).toBe('5.3 km')
    expect(formatDistance(9.99)).toBe('10.0 km')
  })

  it('formats distance as whole number when over 10km', () => {
    expect(formatDistance(15.7)).toBe('16 km')
    expect(formatDistance(100.2)).toBe('100 km')
  })

  it('stores and retrieves location', async () => {
    const loc = { city: 'Sydney', latitude: -33.8688, longitude: 151.2093 }
    await saveLocation(loc)
    const stored = await getStoredLocation()
    expect(stored).toEqual(loc)
  })

  it('returns null when no location is stored', async () => {
    expect(await getStoredLocation()).toBeNull()
  })

  it('clears location correctly', async () => {
    await saveLocation({ city: 'Test', latitude: 0, longitude: 0 })
    await clearLocation()
    expect(await getStoredLocation()).toBeNull()
  })

  it('overwrites previous location', async () => {
    await saveLocation({ city: 'Sydney', latitude: -33, longitude: 151 })
    await saveLocation({ city: 'Melbourne', latitude: -37, longitude: 144 })
    expect((await getStoredLocation())?.city).toBe('Melbourne')
  })

  it('handles location with postcode', async () => {
    const loc = { city: 'Sydney', postcode: '2000', latitude: -33.8688, longitude: 151.2093 }
    await saveLocation(loc)
    expect(await getStoredLocation()).toEqual(loc)
  })
})
