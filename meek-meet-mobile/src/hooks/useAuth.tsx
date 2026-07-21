import { createContext, useContext, useEffect, useState } from 'react'
import { App } from '@capacitor/app'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  role: string | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setRole(null)
      return
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setRole(data?.role ?? 'member')
    }

    fetchProfile()
  }, [user])

  // Handle deep links for magic link auth
  useEffect(() => {
    let appListener: { remove: () => Promise<void> } | null = null

    const handleAppUrlOpen = async ({ url }: { url: string }) => {
      if (url.includes('auth/callback')) {
        try {
          const hashIndex = url.indexOf('#')
          if (hashIndex === -1) return

          const hash = url.substring(hashIndex + 1)
          const params = new URLSearchParams(hash)
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (error) {
              showToast('Sign-in link expired or invalid. Please try again.', 'error')
            }
          }
        } catch (err: any) {
          showToast('Could not complete sign-in: ' + (err?.message || 'Unknown error'), 'error')
        }
      }
    }

    App.addListener('appUrlOpen', handleAppUrlOpen).then((listener) => {
      appListener = listener
    })

    return () => {
      if (appListener) {
        appListener.remove()
      }
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
