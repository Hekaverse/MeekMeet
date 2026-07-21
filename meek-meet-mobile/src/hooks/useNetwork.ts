import { useState, useEffect, useCallback } from 'react'

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      // Reset wasOffline after a short delay so toast only shows once
      setTimeout(() => setWasOffline(false), 3000)
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkOnline = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      })
      // Any HTTP response means we have connectivity
      return res.ok || res.status === 401 || res.status === 400
    } catch {
      return false
    }
  }, [])

  return { isOnline, wasOffline, checkOnline }
}
