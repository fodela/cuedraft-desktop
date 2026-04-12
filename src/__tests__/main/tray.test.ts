import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTray, destroyTray, hasTray, syncTrayVisibility } from '../../main/tray'

describe('tray', () => {
  beforeEach(() => {
    destroyTray()
    vi.clearAllMocks()
  })

  it('createTray creates a tray instance', () => {
    const tray = createTray()
    expect(tray).toBeDefined()
    expect(hasTray()).toBe(true)
  })

  it('createTray reuses the existing tray instance', () => {
    const first = createTray()
    const second = createTray()
    expect(second).toBe(first)
  })

  it('syncTrayVisibility(false) destroys the tray', () => {
    createTray()
    syncTrayVisibility(false)
    expect(hasTray()).toBe(false)
  })

  it('syncTrayVisibility(true) ensures a tray exists', () => {
    syncTrayVisibility(true)
    expect(hasTray()).toBe(true)
  })
})
