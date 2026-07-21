import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetwork } from './useNetwork'

describe('useNetwork', () => {
  let onlineListeners: Array<() => void> = []
  let offlineListeners: Array<() => void> = []

  beforeEach(() => {
    onlineListeners = []
    offlineListeners = []

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    })

    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'online') onlineListeners.push(handler as () => void)
      if (event === 'offline') offlineListeners.push(handler as () => void)
    })

    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial online state', () => {
    const { result } = renderHook(() => useNetwork())
    expect(result.current.isOnline).toBe(true)
  })

  it('detects going offline', () => {
    const { result } = renderHook(() => useNetwork())

    act(() => {
      navigator.onLine = false
      offlineListeners.forEach((fn) => fn())
    })

    expect(result.current.isOnline).toBe(false)
  })

  it('detects coming back online', () => {
    const { result } = renderHook(() => useNetwork())

    act(() => {
      navigator.onLine = false
      offlineListeners.forEach((fn) => fn())
    })

    act(() => {
      navigator.onLine = true
      onlineListeners.forEach((fn) => fn())
    })

    expect(result.current.isOnline).toBe(true)
    expect(result.current.wasOffline).toBe(true)
  })

  it('checkOnline returns true for successful fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))

    const { result } = renderHook(() => useNetwork())
    const isOnline = await result.current.checkOnline()

    expect(isOnline).toBe(true)
  })

  it('checkOnline returns true when the server responds with an auth error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }))

    const { result } = renderHook(() => useNetwork())
    const isOnline = await result.current.checkOnline()

    expect(isOnline).toBe(true)
  })

  it('checkOnline returns false for failed fetch', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useNetwork())
    const isOnline = await result.current.checkOnline()

    expect(isOnline).toBe(false)
  })
})
