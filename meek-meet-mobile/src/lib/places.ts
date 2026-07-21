import type { ExternalGathering } from '@/types'

function getApiKey(): string | undefined {
  return import.meta.env.VITE_GOOGLE_PLACES_API_KEY
}

// ── Error Types ──────────────────────────────────────────────

export class PlacesError extends Error {
  constructor(
    message: string,
    public readonly code: 'NO_API_KEY' | 'QUOTA_EXCEEDED' | 'REQUEST_DENIED' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'UNKNOWN_ERROR',
    public readonly status?: string
  ) {
    super(message)
    this.name = 'PlacesError'
  }
}

// ── Types ────────────────────────────────────────────────────

export interface GooglePlace {
  place_id: string
  name: string
  vicinity: string
  geometry: {
    location: { lat: number; lng: number }
  }
  types: string[]
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  rating?: number
  user_ratings_total?: number
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
  business_status?: string
}

// ── Cache with TTL ───────────────────────────────────────────

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 200

class TTLCache<K, V> {
  private map = new Map<K, CacheEntry<V>>()

  get(key: K): V | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: K, value: V, ttlMs = DEFAULT_TTL_MS) {
    if (this.map.size >= MAX_CACHE_SIZE) {
      const first = this.map.keys().next().value
      if (first !== undefined) this.map.delete(first)
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  clear() {
    this.map.clear()
  }
}

const placeCache = new TTLCache<string, any>()
const requestDedup = new Map<string, Promise<any>>()

// ── Public Cache API ─────────────────────────────────────────

export function cacheDiscoveredPlace(place: ExternalGathering, ttlMs?: number) {
  placeCache.set(place.id, place, ttlMs)
}

export function getCachedPlace(id: string): ExternalGathering | undefined {
  return placeCache.get(id) as ExternalGathering | undefined
}

export function clearPlacesCache() {
  placeCache.clear()
  requestDedup.clear()
}

// ── Normalization ────────────────────────────────────────────

function mapGoogleTypeToTradition(types: string[]): string {
  if (types.includes('church') || (types.includes('hindu_temple') === false && types.some((t) => t.includes('church')))) return 'christian'
  if (types.includes('mosque')) return 'islamic'
  if (types.includes('synagogue')) return 'jewish'
  if (types.includes('hindu_temple')) return 'hindu'
  if (types.includes('buddhist_temple')) return 'buddhist'
  return 'interfaith'
}

function mapGoogleTypeToDenomination(types: string[]): string {
  if (types.includes('church')) {
    const name = types.find((t) => t.includes('catholic')) ? 'Catholic'
      : types.find((t) => t.includes('anglican')) ? 'Anglican'
      : types.find((t) => t.includes('baptist')) ? 'Baptist'
      : types.find((t) => t.includes('methodist')) ? 'Methodist'
      : types.find((t) => t.includes('orthodox')) ? 'Orthodox'
      : types.find((t) => t.includes('pentecostal')) ? 'Pentecostal'
      : 'Christian'
    return name
  }
  if (types.includes('mosque')) return 'Islamic'
  if (types.includes('synagogue')) return 'Jewish'
  if (types.includes('hindu_temple')) return 'Hindu'
  if (types.includes('buddhist_temple')) return 'Buddhist'
  return 'Place of Worship'
}

function normalizePlace(p: GooglePlace): ExternalGathering {
  const tradition = mapGoogleTypeToTradition(p.types)
  const denomination = mapGoogleTypeToDenomination(p.types)
  const address = p.vicinity || ''
  const city = address.split(',').pop()?.trim() || ''

  return {
    id: `gp_${p.place_id}`,
    name: p.name,
    tradition,
    denomination,
    description: `${p.name} is a ${denomination.toLowerCase()} place of worship${city ? ` in ${city}` : ''}.`,
    location: city || 'Unknown',
    address,
    latitude: p.geometry.location.lat,
    longitude: p.geometry.location.lng,
    website: '',
    phone: '',
    meetingTimes: [],
    googlePlaceId: p.place_id,
    googleRating: p.rating,
    googleRatingCount: p.user_ratings_total,
  }
}

// ── Internal fetch with retry ────────────────────────────────

async function placesFetch<T>(url: URL, retries = 2): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        throw new PlacesError(
          `HTTP ${res.status}: ${res.statusText}`,
          'NETWORK_ERROR'
        )
      }

      const data = await res.json()

      if (data.status === 'REQUEST_DENIED') {
        throw new PlacesError(
          'API request denied. Check your API key and restrictions.',
          'REQUEST_DENIED',
          data.status
        )
      }

      if (data.status === 'OVER_QUERY_LIMIT') {
        throw new PlacesError(
          'API quota exceeded. Try again later.',
          'QUOTA_EXCEEDED',
          data.status
        )
      }

      return data
    } catch (err) {
      if (err instanceof PlacesError) throw err
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
      }
    }
  }

  throw new PlacesError(
    lastError?.message || 'Network request failed after retries',
    'NETWORK_ERROR'
  )
}

// ── Deduplicated request wrapper ─────────────────────────────

async function dedupedRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = requestDedup.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = fn().finally(() => {
    requestDedup.delete(key)
  })

  requestDedup.set(key, promise)
  return promise
}

// ── Public API ───────────────────────────────────────────────

export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number = 15000
): Promise<ExternalGathering[]> {
  if (!getApiKey()) {
    throw new PlacesError('Google Places API key not configured', 'NO_API_KEY')
  }

  const cacheKey = `nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`
  const cached = placeCache.get(cacheKey)
  if (cached && Array.isArray(cached)) {
    return cached as ExternalGathering[]
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', String(radius))
  url.searchParams.set('type', 'place_of_worship')
  url.searchParams.set('key', getApiKey()!)

  return dedupedRequest(cacheKey, async () => {
    const data = await placesFetch<{
      status: string
      results?: GooglePlace[]
      error_message?: string
    }>(url)

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new PlacesError(
        data.error_message || `Places API returned: ${data.status}`,
        'INVALID_RESPONSE',
        data.status
      )
    }

    const places: GooglePlace[] = data.results || []
    const results = places.map(normalizePlace)
    results.forEach((p) => cacheDiscoveredPlace(p))
    placeCache.set(cacheKey, results as unknown as ExternalGathering, DEFAULT_TTL_MS)
    return results
  })
}

export async function getPlaceDetails(placeId: string): Promise<{
  phone?: string
  website?: string
  openingHours?: string[]
}> {
  if (!getApiKey()) return {}

  const cacheKey = `details:${placeId}`
  const cached = placeCache.get(cacheKey)
  if (cached && !Array.isArray(cached) && 'phone' in (cached as object)) {
    return cached as unknown as { phone?: string; website?: string; openingHours?: string[] }
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'formatted_phone_number,website,opening_hours')
  url.searchParams.set('key', getApiKey()!)

  return dedupedRequest(cacheKey, async () => {
    const data = await placesFetch<{
      result?: {
        formatted_phone_number?: string
        website?: string
        opening_hours?: { weekday_text?: string[] }
      }
    }>(url)

    const result = data.result || {}
    const details = {
      phone: result.formatted_phone_number,
      website: result.website,
      openingHours: result.opening_hours?.weekday_text,
    }

    placeCache.set(cacheKey, details as unknown as ExternalGathering, DEFAULT_TTL_MS)
    return details
  })
}

export async function fetchPlaceById(placeId: string): Promise<ExternalGathering | null> {
  const cached = getCachedPlace(placeId)
  if (cached) return cached

  if (!getApiKey()) {
    throw new PlacesError('Google Places API key not configured', 'NO_API_KEY')
  }

  if (!placeId.startsWith('gp_')) return null

  const googleId = placeId.replace('gp_', '')

  const cacheKey = `place:${placeId}`
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', googleId)
  url.searchParams.set('fields', 'place_id,name,vicinity,geometry,type,photos,rating,user_ratings_total,formatted_phone_number,website,opening_hours')
  url.searchParams.set('key', getApiKey()!)

  return dedupedRequest(cacheKey, async () => {
    const data = await placesFetch<{
      result?: GooglePlace & {
        formatted_phone_number?: string
        website?: string
      }
    }>(url)

    const p = data.result
    if (!p) return null

    const place: ExternalGathering = {
      id: `gp_${p.place_id}`,
      name: p.name,
      tradition: mapGoogleTypeToTradition(p.types || []),
      denomination: mapGoogleTypeToDenomination(p.types || []),
      description: `${p.name} is a place of worship in ${(p.vicinity || '').split(',').pop()?.trim() || 'the area'}.`,
      location: (p.vicinity || '').split(',').pop()?.trim() || 'Unknown',
      address: p.vicinity || '',
      latitude: p.geometry?.location?.lat ?? 0,
      longitude: p.geometry?.location?.lng ?? 0,
      website: p.website || '',
      phone: p.formatted_phone_number || '',
      meetingTimes: [],
      googlePlaceId: p.place_id,
      googleRating: p.rating,
      googleRatingCount: p.user_ratings_total,
    }

    cacheDiscoveredPlace(place)
    return place
  })
}

export async function searchPlacesByQuery(
  query: string,
  lat?: number,
  lng?: number,
  radius: number = 50000
): Promise<ExternalGathering[]> {
  if (!getApiKey()) {
    throw new PlacesError('Google Places API key not configured', 'NO_API_KEY')
  }

  const cacheKey = `query:${query}:${lat ?? ''}:${lng ?? ''}:${radius}`
  const cached = placeCache.get(cacheKey)
  if (cached && Array.isArray(cached)) {
    return cached as ExternalGathering[]
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('type', 'place_of_worship')
  url.searchParams.set('key', getApiKey()!)
  if (lat !== undefined && lng !== undefined) {
    url.searchParams.set('location', `${lat},${lng}`)
    url.searchParams.set('radius', String(radius))
  }

  return dedupedRequest(cacheKey, async () => {
    const data = await placesFetch<{
      status: string
      results?: GooglePlace[]
      error_message?: string
    }>(url)

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new PlacesError(
        data.error_message || `Places API returned: ${data.status}`,
        'INVALID_RESPONSE',
        data.status
      )
    }

    const places: GooglePlace[] = data.results || []
    const results = places.map(normalizePlace)
    results.forEach((p) => cacheDiscoveredPlace(p))
    placeCache.set(cacheKey, results as unknown as ExternalGathering, DEFAULT_TTL_MS)
    return results
  })
}
