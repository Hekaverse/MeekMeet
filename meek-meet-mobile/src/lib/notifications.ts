import { LocalNotifications } from '@capacitor/local-notifications'
import { getNotificationEnabled, getNotificationTime, setNotificationEnabled, setNotificationTime } from '@/lib/preferences'
import { getCuratedDailyVerse } from '@/data/curated-daily'

export async function checkNotificationPermission(): Promise<boolean> {
  const { display } = await LocalNotifications.checkPermissions()
  return display === 'granted'
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { display } = await LocalNotifications.requestPermissions()
  return display === 'granted'
}

export async function scheduleDailyVerseNotification(): Promise<void> {
  const enabled = await getNotificationEnabled()
  if (!enabled) return

  const timeStr = await getNotificationTime()
  const [hour, minute] = timeStr.split(':').map(Number)

  const curated = getCuratedDailyVerse()
  const body = `${curated.book} ${curated.chapter}:${curated.verse} \u2014 ${curated.text.slice(0, 60)}...`

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: "Today's Verse",
        body,
        schedule: {
          on: {
            hour,
            minute,
          },
          repeats: true,
        },
        sound: 'default',
        smallIcon: 'ic_notification',
      },
    ],
  })
}

export async function cancelDailyVerseNotification(): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: 1 }] })
}

export async function enableDailyVerseNotification(time?: string): Promise<boolean> {
  const granted = await requestNotificationPermission()
  if (!granted) {
    await setNotificationEnabled(false)
    return false
  }

  await setNotificationEnabled(true)
  if (time) await setNotificationTime(time)
  await scheduleDailyVerseNotification()
  return true
}

export async function disableDailyVerseNotification(): Promise<void> {
  await setNotificationEnabled(false)
  await cancelDailyVerseNotification()
}

export async function updateDailyVerseNotificationTime(time: string): Promise<void> {
  await setNotificationTime(time)
  const enabled = await getNotificationEnabled()
  if (enabled) {
    await cancelDailyVerseNotification()
    await scheduleDailyVerseNotification()
  }
}

// ── Meeting Notifications ──────────────────────────

function meetingIdToInt(meetingId: string, offset: number): number {
  // Deterministic 31-bit positive integer from UUID
  let hash = 0
  for (let i = 0; i < meetingId.length; i++) {
    const char = meetingId.charCodeAt(i)
    hash = (hash * 31 + char) & 0x7fffffff
  }
  return offset + (hash % 100000)
}

export async function scheduleMeetingNotifications(
  meetingId: string,
  scheduledAt: string,
  circleName: string
): Promise<void> {
  const granted = await checkNotificationPermission()
  if (!granted) return

  const scheduled = new Date(scheduledAt)
  const now = new Date()

  const notifications: { id: number; title: string; body: string; schedule: { at: Date; allowWhileIdle?: boolean } }[] = []

  // 24-hour reminder
  const reminder24h = new Date(scheduled.getTime() - 24 * 60 * 60 * 1000)
  if (reminder24h > now) {
    notifications.push({
      id: meetingIdToInt(meetingId, 1_000_000),
      title: `Upcoming Meet \u2014 ${circleName}`,
      body: `Your meet is scheduled for ${scheduled.toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`,
      schedule: { at: reminder24h, allowWhileIdle: true },
    })
  }

  // 1-hour reminder
  const reminder1h = new Date(scheduled.getTime() - 60 * 60 * 1000)
  if (reminder1h > now) {
    notifications.push({
      id: meetingIdToInt(meetingId, 2_000_000),
      title: `Meet starts in 1 hour \u2014 ${circleName}`,
      body: `Get ready! Your meet begins at ${scheduled.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}.`,
      schedule: { at: reminder1h, allowWhileIdle: true },
    })
  }

  // Day-of question release reminder (if questions were released early)
  const reminderDayOf = new Date(scheduled.getTime())
  reminderDayOf.setHours(8, 0, 0, 0)
  if (reminderDayOf > now && reminderDayOf < scheduled) {
    notifications.push({
      id: meetingIdToInt(meetingId, 3_000_000),
      title: `Questions are ready \u2014 ${circleName}`,
      body: `Tap to view the discussion questions for today's meet.`,
      schedule: { at: reminderDayOf, allowWhileIdle: true },
    })
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: n.schedule,
        sound: 'default',
        smallIcon: 'ic_notification',
      })),
    })
  }
}

export async function cancelMeetingNotifications(meetingId: string): Promise<void> {
  await LocalNotifications.cancel({
    notifications: [
      { id: meetingIdToInt(meetingId, 1_000_000) },
      { id: meetingIdToInt(meetingId, 2_000_000) },
      { id: meetingIdToInt(meetingId, 3_000_000) },
    ],
  })
}
