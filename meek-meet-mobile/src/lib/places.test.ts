import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  searchNearbyPlaces,
  getPlaceDetails,
  fetchPlaceById,
  searchPlacesByQuery,
  cacheDiscoveredPlace,
  getCachedPlace,
  clearPlacesCache,
  PlacesError,
} from './places'
import { createFetchMock, mockJsonResponse, mockNetworkError } from '@/test/mocks'

describe('places API', () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock()
    clearPlacesCache()
    vi.stubEnv('VITE_GOOGLE_PLACES_API_KEY', 'test_key_123')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('searchNearbyPlaces', () => {
    it('returns normalized places on success', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          status: 'OK',
          results: [
            {
              place_id: 'abc123',
              name: 'St Marys Church',
              vicinity: '123 Main St, Sydney',
              geometry: { location: { lat: -33.8, lng: 151.2 } },
              types: ['church', 'place_of_worship'],
              rating: 4.5,
              user_ratings_total: 120,
            },
          ],
        })
      )

      const results = await searchNearbyPlaces(-33.86, 151.2)
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('gp_abc123')
      expect(results[0].name).toBe('St Marys Church')
      expect(results[0].tradition).toBe('christian')
      expect(results[0].denomination).toBe('Christian')
      expect(results[0].googleRating).toBe(4.5)
    })

    it('returns empty array for zero results', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({ status: 'ZERO_RESULTS', results: [] })
      )

      const results = await searchNearbyPlaces(-33.86, 151.2)
      expect(results).toHaveLength(0)
    })

    it('throws PlacesError when API key is missing', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('VITE_GOOGLE_PLACES_API_KEY', '')

      await expect(searchNearbyPlaces(-33.86, 151.2)).rejects.toThrow(PlacesError)
      await expect(searchNearbyPlaces(-33.86, 151.2)).rejects.toThrow('Google Places API key not configured')
    })

    it('throws PlacesError on request denied', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          status: 'REQUEST_DENIED',
          error_message: 'The provided API key is invalid.',
        })
      )

      await expect(searchNearbyPlaces(-33.86, 151.2)).rejects.toThrow(PlacesError)
      await expect(searchNearbyPlaces(-33.86, 151.2)).rejects.toThrow('denied')
    })

    it('throws PlacesError on quota exceeded', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({ status: 'OVER_QUERY_LIMIT' })
      )

      await expect(searchNearbyPlaces(-33.86, 151.2)).rejects.toThrow(PlacesError)
      await expect(searchNearbyPlaces(-33.86, 151.2)).rejects.toThrow('quota')
    })

    it('retries on network failure then throws', async () => {
      fetchMock
        .mockImplementationOnce(mockNetworkError)
        .mockImplementationOnce(mockNetworkError)
        .mockImplementationOnce(mockNetworkError)

      await expect(searchNearbyPlaces(-33.86, 151.2)).rejects.toThrow(PlacesError)
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('deduplicates in-flight requests', async () => {
      let resolveFn: (value: Response) => void
      const promise = new Promise<Response>((resolve) => {
        resolveFn = resolve
      })
      fetchMock.mockImplementation(() => promise)

      const p1 = searchNearbyPlaces(-33.86, 151.2)
      const p2 = searchNearbyPlaces(-33.86, 151.2)

      resolveFn!(new Response(JSON.stringify({ status: 'OK', results: [] }), { status: 200 }))

      const [r1, r2] = await Promise.all([p1, p2])
      expect(r1).toBe(r2)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('caches results and returns cached on subsequent calls', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          status: 'OK',
          results: [
            {
              place_id: 'cached1',
              name: 'Cached Church',
              vicinity: 'Sydney',
              geometry: { location: { lat: -33.8, lng: 151.2 } },
              types: ['church'],
            },
          ],
        })
      )

      const r1 = await searchNearbyPlaces(-33.86, 151.2)
      expect(r1).toHaveLength(1)

      // Second call should use cache
      const r2 = await searchNearbyPlaces(-33.86, 151.2)
      expect(r2).toHaveLength(1)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('caches discovered places individually', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          status: 'OK',
          results: [
            {
              place_id: 'discovered1',
              name: 'Discovered Mosque',
              vicinity: 'Melbourne',
              geometry: { location: { lat: -37.8, lng: 144.9 } },
              types: ['mosque'],
            },
          ],
        })
      )

      await searchNearbyPlaces(-37.81, 144.96)
      const cached = getCachedPlace('gp_discovered1')
      expect(cached).toBeDefined()
      expect(cached?.name).toBe('Discovered Mosque')
      expect(cached?.tradition).toBe('islamic')
    })
  })

  describe('getPlaceDetails', () => {
    it('returns phone, website and opening hours', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          result: {
            formatted_phone_number: '(02) 1234 5678',
            website: 'https://example.com',
            opening_hours: { weekday_text: ['Mon: 9am-5pm'] },
          },
        })
      )

      const details = await getPlaceDetails('place_123')
      expect(details.phone).toBe('(02) 1234 5678')
      expect(details.website).toBe('https://example.com')
      expect(details.openingHours).toEqual(['Mon: 9am-5pm'])
    })

    it('returns empty object when API key missing', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('VITE_GOOGLE_PLACES_API_KEY', '')
      const details = await getPlaceDetails('place_123')
      expect(details).toEqual({})
    })

    it('caches details results', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          result: { formatted_phone_number: '1234' },
        })
      )

      await getPlaceDetails('place_123')
      await getPlaceDetails('place_123')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('fetchPlaceById', () => {
    it('returns cached place without network call', async () => {
      cacheDiscoveredPlace({
        id: 'gp_cached_place',
        name: 'Cached',
        tradition: 'christian',
        denomination: 'Catholic',
        description: '',
        location: '',
        address: '',
        latitude: 0,
        longitude: 0,
        website: '',
        phone: '',
        meetingTimes: [],
      })

      const place = await fetchPlaceById('gp_cached_place')
      expect(place?.name).toBe('Cached')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fetches place details by google place ID', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          result: {
            place_id: 'goog123',
            name: 'Test Synagogue',
            vicinity: 'Bondi, Sydney',
            geometry: { location: { lat: -33.89, lng: 151.27 } },
            types: ['synagogue'],
            rating: 4.8,
            user_ratings_total: 50,
            formatted_phone_number: '02 9876 5432',
            website: 'https://synagogue.example',
          },
        })
      )

      const place = await fetchPlaceById('gp_goog123')
      expect(place).not.toBeNull()
      expect(place?.name).toBe('Test Synagogue')
      expect(place?.tradition).toBe('jewish')
      expect(place?.phone).toBe('02 9876 5432')
      expect(place?.website).toBe('https://synagogue.example')
    })

    it('returns null for non-gp IDs', async () => {
      const place = await fetchPlaceById('manual_123')
      expect(place).toBeNull()
    })

    it('throws PlacesError without API key', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('VITE_GOOGLE_PLACES_API_KEY', '')

      await expect(fetchPlaceById('gp_123')).rejects.toThrow(PlacesError)
    })
  })

  describe('searchPlacesByQuery', () => {
    it('returns places matching query', async () => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          status: 'OK',
          results: [
            {
              place_id: 'q1',
              name: 'Buddhist Temple',
              vicinity: 'Perth',
              geometry: { location: { lat: -31.9, lng: 115.8 } },
              types: ['buddhist_temple'],
            },
          ],
        })
      )

      const results = await searchPlacesByQuery('buddhist temple perth')
      expect(results).toHaveLength(1)
      expect(results[0].tradition).toBe('buddhist')
    })

    it('includes location bias when lat/lng provided', async () => {
      fetchMock.mockImplementation(() => mockJsonResponse({ status: 'OK', results: [] }))

      await searchPlacesByQuery('church', -33.86, 151.2, 10000)

      const url = new URL(fetchMock.mock.calls[0][0] as string)
      expect(url.searchParams.get('location')).toBe('-33.86,151.2')
      expect(url.searchParams.get('radius')).toBe('10000')
    })
  })

  describe('tradition mapping', () => {
    it.each([
      [['church', 'place_of_worship'], 'christian'],
      [['mosque'], 'islamic'],
      [['synagogue'], 'jewish'],
      [['hindu_temple'], 'hindu'],
      [['buddhist_temple'], 'buddhist'],
      [['place_of_worship'], 'interfaith'],
    ])('maps %j to %s', async (types, expected) => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          status: 'OK',
          results: [
            {
              place_id: 'type_test',
              name: 'Test',
              vicinity: 'City',
              geometry: { location: { lat: 0, lng: 0 } },
              types,
            },
          ],
        })
      )

      const [place] = await searchNearbyPlaces(0, 0)
      expect(place.tradition).toBe(expected)
    })
  })

  describe('denomination mapping', () => {
    it.each([
      [['church', 'catholic_church'], 'Catholic'],
      [['church', 'anglican_church'], 'Anglican'],
      [['church', 'baptist_church'], 'Baptist'],
      [['church', 'methodist_church'], 'Methodist'],
      [['church', 'orthodox_church'], 'Orthodox'],
      [['church', 'pentecostal_church'], 'Pentecostal'],
      [['church'], 'Christian'],
      [['mosque'], 'Islamic'],
      [['synagogue'], 'Jewish'],
      [['hindu_temple'], 'Hindu'],
      [['buddhist_temple'], 'Buddhist'],
      [['place_of_worship'], 'Place of Worship'],
    ])('maps %j to %s', async (types, expectedDenom) => {
      fetchMock.mockImplementation(() =>
        mockJsonResponse({
          status: 'OK',
          results: [
            {
              place_id: 'denom_test',
              name: 'Test',
              vicinity: 'City',
              geometry: { location: { lat: 0, lng: 0 } },
              types,
            },
          ],
        })
      )

      const [place] = await searchNearbyPlaces(0, 0)
      expect(place.denomination).toBe(expectedDenom)
    })
  })
})
