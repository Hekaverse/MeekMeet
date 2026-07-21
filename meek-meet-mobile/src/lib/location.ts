import { Preferences } from '@capacitor/preferences'
import { supabase } from './supabase'

export interface UserLocation {
  city: string
  postcode?: string
  latitude: number
  longitude: number
}

const STORAGE_KEY = 'mm_user_location'

export async function getStoredLocation(): Promise<UserLocation | null> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY })
    if (!value) return null
    return JSON.parse(value) as UserLocation
  } catch {
    return null
  }
}

export async function saveLocation(loc: UserLocation, userId?: string) {
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(loc) })
  if (userId) {
    await supabase.from('profiles').update({ location: loc.city }).eq('id', userId)
  }
}

export async function clearLocation(userId?: string) {
  await Preferences.remove({ key: STORAGE_KEY })
  if (userId) {
    await supabase.from('profiles').update({ location: null }).eq('id', userId)
  }
}

export async function getLocationFromProfile(userId: string): Promise<UserLocation | null> {
  const { data } = await supabase.from('profiles').select('location').eq('id', userId).single()
  if (!data?.location) return null
  const city = AU_CITIES.find((c) => c.name === data.location)
  if (city) {
    return { city: city.name, latitude: city.lat, longitude: city.lng }
  }
  return null
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

const AU_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Sydney, NSW', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne, VIC', lat: -37.8136, lng: 144.9631 },
  { name: 'Brisbane, QLD', lat: -27.4698, lng: 153.0251 },
  { name: 'Perth, WA', lat: -31.9505, lng: 115.8605 },
  { name: 'Adelaide, SA', lat: -34.9285, lng: 138.6007 },
  { name: 'Gold Coast, QLD', lat: -28.0167, lng: 153.4 },
  { name: 'Newcastle, NSW', lat: -32.9283, lng: 151.7817 },
  { name: 'Canberra, ACT', lat: -35.2809, lng: 149.13 },
  { name: 'Wollongong, NSW', lat: -34.425, lng: 150.8931 },
  { name: 'Geelong, VIC', lat: -38.1499, lng: 144.3617 },
  { name: 'Hobart, TAS', lat: -42.8821, lng: 147.3272 },
  { name: 'Townsville, QLD', lat: -19.259, lng: 146.8169 },
  { name: 'Cairns, QLD', lat: -16.9186, lng: 145.7781 },
  { name: 'Darwin, NT', lat: -12.4634, lng: 130.8456 },
  { name: 'Toowoomba, QLD', lat: -27.5598, lng: 151.9507 },
  { name: 'Ballarat, VIC', lat: -37.5622, lng: 143.8503 },
  { name: 'Bendigo, VIC', lat: -36.757, lng: 144.2794 },
  { name: 'Albury, NSW', lat: -36.0737, lng: 146.9135 },
  { name: 'Launceston, TAS', lat: -41.4332, lng: 147.1441 },
  { name: 'Mackay, QLD', lat: -21.1412, lng: 149.1868 },
  { name: 'Rockhampton, QLD', lat: -23.3791, lng: 150.51 },
  { name: 'Bunbury, WA', lat: -33.3256, lng: 115.6396 },
]

export { AU_CITIES }
