import { useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'

export function useBackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const lastBackPress = useRef(0)

  useEffect(() => {
    let listener: { remove: () => Promise<void> } | null = null

    App.addListener('backButton', ({ canGoBack }) => {
      const path = location.pathname
      // On root routes, require a second back press within 2s to exit
      const rootRoutes = ['/', '/read', '/circles', '/dashboard', '/me']
      const isRoot = rootRoutes.includes(path)

      if (isRoot || !canGoBack) {
        const now = Date.now()
        if (now - lastBackPress.current < 2000) {
          App.exitApp()
        } else {
          lastBackPress.current = now
          showToast('Press back again to exit', 'info')
        }
      } else {
        navigate(-1)
      }
    }).then((l) => {
      listener = l
    })

    return () => {
      if (listener) listener.remove()
    }
  }, [navigate, location.pathname, showToast])
}
