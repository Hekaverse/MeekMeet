export const APP_SCHEME = 'com.meekmeet.app'
export const WEB_BASE_URL = 'https://meekmeet.com'

// ── Share URLs ──────────────────────────────────────
// Shared links point at the public website so recipients without the app can
// open them. The site has no /read or /meetings pages: passage shares link to
// the site root, meeting/circle shares to the circle's public page.

export function buildPassageUrl(): string {
  return WEB_BASE_URL
}

export function buildCircleUrl(slug?: string): string {
  return slug ? `${WEB_BASE_URL}/circles/${slug}` : `${WEB_BASE_URL}/circles`
}

export function buildMeetingUrl(): string {
  // A meeting's circle slug isn't available from a meeting id alone — link to
  // the public circles directory instead.
  return `${WEB_BASE_URL}/circles`
}

export function parsePassageUrl(url: string): {
  tradition: string
  bookId: string
  chapter: number
  verse?: number
} | null {
  try {
    // Strip scheme to avoid URL parser rejecting custom schemes in some environments
    const stripped = url.replace(/^[^:]+:\/\//, '')
    const match = stripped.match(
      /^read\/([^/]+)\/([^/]+)\/(\d+)(?:\?verse=(\d+))?$/
    )
    if (!match) return null
    return {
      tradition: match[1],
      bookId: match[2],
      chapter: Number(match[3]),
      verse: match[4] ? Number(match[4]) : undefined,
    }
  } catch {
    return null
  }
}

export function parseMeetingUrl(url: string): { meetingId: string } | null {
  try {
    const stripped = url.replace(/^[^:]+:\/\//, '')
    const match = stripped.match(/^meetings\/([a-f0-9-]+)$/i)
    if (!match) return null
    return { meetingId: match[1] }
  } catch {
    return null
  }
}
