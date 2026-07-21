export interface EmptyStatePoem {
  iconLabel: string
  title: string
  subtitle: string
  cta?: string
}

export const emptyStates: Record<string, EmptyStatePoem> = {
  search: {
    iconLabel: 'Search',
    title: 'Seek, and ye shall find.',
    subtitle: 'Try words like "love," "light," "patience," or "mercy" — the wisdom of ages awaits.',
    cta: 'Try a search',
  },
  searchNoResults: {
    iconLabel: 'Search',
    title: 'The words you seek are moving waters — try another current.',
    subtitle: 'Search across all five traditions with different terms.',
  },
  bookmarks: {
    iconLabel: 'Bookmark',
    title: 'Treasure up the word.',
    subtitle: 'Verses you bookmark will gather here like light in a lantern. Tap the bookmark icon on any verse to begin.',
    cta: 'Start reading',
  },
  history: {
    iconLabel: 'History',
    title: 'Every journey begins with a single step.',
    subtitle: 'Your reading history will appear here. No hurry — the text has waited centuries for you.',
    cta: 'Begin today',
  },
  circles: {
    iconLabel: 'Users',
    title: 'Where two or three are gathered...',
    subtitle: 'Circles are being prepared — warm spaces where people of every path can share and grow.',
    cta: 'Explore gatherings',
  },
  gatherings: {
    iconLabel: 'MapPin',
    title: 'The faithful have always gathered.',
    subtitle: 'Set your location to discover places of worship, study, and community near you.',
    cta: 'Set location',
  },
  readerEmpty: {
    iconLabel: 'BookOpen',
    title: 'This chapter is not yet prepared.',
    subtitle: 'We are shepherding these texts into the app with care. Try another book or chapter.',
    cta: 'Browse books',
  },
  streakBreak: {
    iconLabel: 'Sun',
    title: 'Welcome back.',
    subtitle: 'Streaks are kindling — they help start the fire, but the fire itself is yours to tend. Every return is a new beginning.',
    cta: 'Read today',
  },
  notifications: {
    iconLabel: 'Bell',
    title: 'The still, small voice.',
    subtitle: 'When there is news worth sharing, you will find it here. Until then, peace.',
  },
  notes: {
    iconLabel: 'PenLine',
    title: 'Wisdom begins in wonder.',
    subtitle: 'Notes you write on verses will gather here — your own commentary on the commentary of ages.',
    cta: 'Add a note',
  },
  highlights: {
    iconLabel: 'Highlighter',
    title: 'Light catches what matters.',
    subtitle: 'Highlighted verses will glow here. Long-press any verse to mark it with color.',
    cta: 'Start highlighting',
  },
}
