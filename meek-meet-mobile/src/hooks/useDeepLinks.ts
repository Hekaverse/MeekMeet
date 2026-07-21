import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { parsePassageUrl, parseMeetingUrl } from '@/lib/share'

export function useDeepLinks() {
  const navigate = useNavigate()

  useEffect(() => {
    let listener: { remove: () => void } | null = null

    App.addListener('appUrlOpen', (event) => {
      const url = event.url
      if (!url) return

      // Skip auth callbacks (handled by useAuth)
      if (url.includes('/auth/callback')) return

      // Handle passage links: com.meekmeet.app://read/...
      const passage = parsePassageUrl(url)
      if (passage) {
        const path = `/read/${passage.tradition}/${passage.bookId}/${passage.chapter}`
        if (passage.verse) {
          navigate(`${path}?verse=${passage.verse}`)
        } else {
          navigate(path)
        }
        return
      }

      // Handle meeting invite links: com.meekmeet.app://meetings/...
      const meeting = parseMeetingUrl(url)
      if (meeting) {
        navigate(`/meetings/${meeting.meetingId}`)
        return
      }
    }).then((l) => {
      listener = l
    })

    return () => {
      if (listener) {
        listener.remove()
      }
    }
  }, [navigate])
}
