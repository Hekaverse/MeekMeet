import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export async function hapticImpact(style: ImpactStyle = ImpactStyle.Light) {
  try {
    await Haptics.impact({ style })
  } catch {
    // Haptics not available on this device
  }
}

export async function hapticNotification(type: NotificationType = NotificationType.Success) {
  try {
    await Haptics.notification({ type })
  } catch {
    // Haptics not available
  }
}

export async function hapticSelect() {
  await hapticImpact(ImpactStyle.Light)
}

export async function hapticLight() {
  await hapticImpact(ImpactStyle.Light)
}

export async function hapticSuccess() {
  await hapticNotification(NotificationType.Success)
}

export async function hapticError() {
  await hapticNotification(NotificationType.Error)
}
