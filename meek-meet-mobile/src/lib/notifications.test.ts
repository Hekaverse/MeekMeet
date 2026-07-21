import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Capacitor LocalNotifications
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: vi.fn(),
    cancel: vi.fn(),
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// Mock preferences
const prefStore: Record<string, string> = {}
vi.mock('@/lib/preferences', () => ({
  getNotificationEnabled: vi.fn(() => Promise.resolve(prefStore.enabled === 'true')),
  getNotificationTime: vi.fn(() => Promise.resolve(prefStore.time ?? '08:00')),
  setNotificationEnabled: vi.fn((v: boolean) => { prefStore.enabled = String(v) }),
  setNotificationTime: vi.fn((v: string) => { prefStore.time = v }),
}))

// Mock curated daily verse
vi.mock('@/data/curated-daily', () => ({
  getCuratedDailyVerse: vi.fn(() => ({
    book: 'Genesis',
    chapter: 1,
    verse: 1,
    text: 'In the beginning God created the heaven and the earth.',
  })),
}))

import { LocalNotifications } from '@capacitor/local-notifications'
import {
  checkNotificationPermission,
  requestNotificationPermission,
  scheduleDailyVerseNotification,
  cancelDailyVerseNotification,
  enableDailyVerseNotification,
  disableDailyVerseNotification,
  updateDailyVerseNotificationTime,
} from './notifications'

describe('checkNotificationPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when granted', async () => {
    vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'granted' } as any)
    expect(await checkNotificationPermission()).toBe(true)
  })

  it('returns false when denied', async () => {
    vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'denied' } as any)
    expect(await checkNotificationPermission()).toBe(false)
  })
})

describe('requestNotificationPermission', () => {
  it('returns true when user grants', async () => {
    vi.mocked(LocalNotifications.requestPermissions).mockResolvedValue({ display: 'granted' } as any)
    expect(await requestNotificationPermission()).toBe(true)
  })
})

describe('scheduleDailyVerseNotification', () => {
  it('schedules a notification at 08:00 by default', async () => {
    prefStore.enabled = 'true'
    prefStore.time = '08:00'
    await scheduleDailyVerseNotification()

    expect(LocalNotifications.schedule).toHaveBeenCalledOnce()
    const call = vi.mocked(LocalNotifications.schedule).mock.calls[0][0] as any
    expect(call.notifications[0].title).toBe("Today's Verse")
    expect(call.notifications[0].schedule.on.hour).toBe(8)
    expect(call.notifications[0].schedule.on.minute).toBe(0)
    expect(call.notifications[0].schedule.repeats).toBe(true)
  })

  it('does nothing when notifications are disabled', async () => {
    prefStore.enabled = 'false'
    await scheduleDailyVerseNotification()
    expect(LocalNotifications.schedule).not.toHaveBeenCalled()
  })
})

describe('cancelDailyVerseNotification', () => {
  it('cancels notification with id 1', async () => {
    await cancelDailyVerseNotification()
    expect(LocalNotifications.cancel).toHaveBeenCalledWith({ notifications: [{ id: 1 }] })
  })
})

describe('enableDailyVerseNotification', () => {
  it('returns false when permission denied', async () => {
    vi.mocked(LocalNotifications.requestPermissions).mockResolvedValue({ display: 'denied' } as any)
    const result = await enableDailyVerseNotification()
    expect(result).toBe(false)
    expect(prefStore.enabled).toBe('false')
  })

  it('schedules notification when permission granted', async () => {
    vi.mocked(LocalNotifications.requestPermissions).mockResolvedValue({ display: 'granted' } as any)
    const result = await enableDailyVerseNotification('07:30')
    expect(result).toBe(true)
    expect(prefStore.enabled).toBe('true')
    expect(prefStore.time).toBe('07:30')
    expect(LocalNotifications.schedule).toHaveBeenCalledOnce()
  })
})

describe('disableDailyVerseNotification', () => {
  it('sets enabled false and cancels', async () => {
    await disableDailyVerseNotification()
    expect(prefStore.enabled).toBe('false')
    expect(LocalNotifications.cancel).toHaveBeenCalledOnce()
  })
})

describe('updateDailyVerseNotificationTime', () => {
  it('cancels and reschedules when notifications are enabled', async () => {
    prefStore.enabled = 'true'
    prefStore.time = '08:00'
    await updateDailyVerseNotificationTime('19:30')

    expect(prefStore.time).toBe('19:30')
    expect(LocalNotifications.cancel).toHaveBeenCalledOnce()
    expect(LocalNotifications.schedule).toHaveBeenCalledOnce()
  })

  it('only updates time when notifications are disabled', async () => {
    prefStore.enabled = 'false'
    await updateDailyVerseNotificationTime('12:00')

    expect(prefStore.time).toBe('12:00')
    expect(LocalNotifications.cancel).not.toHaveBeenCalled()
    expect(LocalNotifications.schedule).not.toHaveBeenCalled()
  })
})
