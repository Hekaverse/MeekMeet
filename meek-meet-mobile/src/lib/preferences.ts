import { Preferences } from '@capacitor/preferences'

export async function getPref<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key })
    if (value === null) return fallback
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export async function setPref<T>(key: string, value: T): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) })
}

export async function removePref(key: string): Promise<void> {
  await Preferences.remove({ key })
}

// Onboarding
export const ONBOARDED_KEY = 'mm_onboarded'
export const getOnboarded = () => getPref(ONBOARDED_KEY, false)
export const setOnboarded = (v: boolean) => setPref(ONBOARDED_KEY, v)

// Notification settings
export const NOTIFICATION_ENABLED_KEY = 'mm_notifications_enabled'
export const NOTIFICATION_TIME_KEY = 'mm_notification_time'
export const getNotificationEnabled = () => getPref(NOTIFICATION_ENABLED_KEY, false)
export const setNotificationEnabled = (v: boolean) => setPref(NOTIFICATION_ENABLED_KEY, v)
export const getNotificationTime = () => getPref(NOTIFICATION_TIME_KEY, '07:00')
export const setNotificationTime = (v: string) => setPref(NOTIFICATION_TIME_KEY, v)
