import { describe, it, expect, vi } from 'vitest'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { hapticSelect, hapticSuccess, hapticError } from './haptics'

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(),
    notification: vi.fn(),
  },
  ImpactStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
  },
  NotificationType: {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR',
  },
}))

describe('haptics', () => {
  it('hapticSelect triggers light impact', async () => {
    await hapticSelect()
    expect(Haptics.impact).toHaveBeenCalledWith({ style: 'LIGHT' })
  })

  it('hapticSuccess triggers success notification', async () => {
    await hapticSuccess()
    expect(Haptics.notification).toHaveBeenCalledWith({ type: 'SUCCESS' })
  })

  it('hapticError triggers error notification', async () => {
    await hapticError()
    expect(Haptics.notification).toHaveBeenCalledWith({ type: 'ERROR' })
  })

  it('does not throw if haptics fail', async () => {
    vi.mocked(Haptics.impact).mockRejectedValueOnce(new Error('Haptics not available'))
    await expect(hapticSelect()).resolves.not.toThrow()
  })
})
