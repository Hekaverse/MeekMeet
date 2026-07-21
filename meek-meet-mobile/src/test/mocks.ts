import { vi } from 'vitest'

// ── Fetch Mock ───────────────────────────────────────────────

export function createFetchMock() {
  const mock = vi.fn<typeof fetch>()
  globalThis.fetch = mock
  return mock
}

export function mockJsonResponse<T>(data: T, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

export function mockNetworkError(message = 'Network error') {
  return Promise.reject(new Error(message))
}

// ── Supabase Mock ────────────────────────────────────────────

export function createSupabaseMock() {
  const authMock = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    setSession: vi.fn().mockResolvedValue({ error: null }),
  }

  const fromMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })

  return {
    auth: authMock,
    from: fromMock,
  }
}

// ── Capacitor App Mock ───────────────────────────────────────

export function createAppMock() {
  return {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    exitApp: vi.fn(),
  }
}

// ── Capacitor Geolocation Mock ───────────────────────────────

export function createGeolocationMock() {
  return {
    requestPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
    getCurrentPosition: vi.fn().mockResolvedValue({
      coords: { latitude: -33.8688, longitude: 151.2093, accuracy: 10 },
    }),
  }
}

// ── LocalStorage Mock ────────────────────────────────────────

export class LocalStorageMock {
  store: Record<string, string> = {}

  getItem(key: string) {
    return this.store[key] ?? null
  }

  setItem(key: string, value: string) {
    this.store[key] = value
  }

  removeItem(key: string) {
    delete this.store[key]
  }

  clear() {
    this.store = {}
  }

  get length() {
    return Object.keys(this.store).length
  }

  key(index: number) {
    return Object.keys(this.store)[index] ?? null
  }
}
