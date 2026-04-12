import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('child_process', () => ({ execFileSync: vi.fn() }))

describe('platform', () => {
  const originalPlatform = process.platform

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true })
    delete process.env.WAYLAND_DISPLAY
    delete process.env.ELECTRON_OZONE_PLATFORM_HINT
    vi.resetModules()
  })

  async function loadPlatform() {
    vi.resetModules()
    return import('../../main/platform')
  }

  describe('getPlatform', () => {
    it('returns "win32" when process.platform is win32', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true })
      const { getPlatform } = await loadPlatform()
      expect(getPlatform()).toBe('win32')
    })

    it('returns "linux-wayland" when WAYLAND_DISPLAY is set', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true })
      process.env.WAYLAND_DISPLAY = 'wayland-0'
      const { getPlatform } = await loadPlatform()
      expect(getPlatform()).toBe('linux-wayland')
    })

    it('returns "linux-x11" when WAYLAND_DISPLAY is not set', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true })
      delete process.env.WAYLAND_DISPLAY
      const { getPlatform } = await loadPlatform()
      expect(getPlatform()).toBe('linux-x11')
    })

    it('returns "linux-x11" when WAYLAND_DISPLAY is set but ELECTRON_OZONE_PLATFORM_HINT is x11', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true })
      process.env.WAYLAND_DISPLAY = 'wayland-0'
      process.env.ELECTRON_OZONE_PLATFORM_HINT = 'x11'
      const { getPlatform } = await loadPlatform()
      expect(getPlatform()).toBe('linux-x11')
    })
  })

  describe('isWayland', () => {
    it('returns true when WAYLAND_DISPLAY is non-empty', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true })
      process.env.WAYLAND_DISPLAY = 'wayland-0'
      const { isWayland } = await loadPlatform()
      expect(isWayland()).toBe(true)
    })

    it('returns false when WAYLAND_DISPLAY is undefined', async () => {
      delete process.env.WAYLAND_DISPLAY
      const { isWayland } = await loadPlatform()
      expect(isWayland()).toBe(false)
    })

    it('returns false when ELECTRON_OZONE_PLATFORM_HINT is x11', async () => {
      process.env.WAYLAND_DISPLAY = 'wayland-0'
      process.env.ELECTRON_OZONE_PLATFORM_HINT = 'x11'
      const { isWayland } = await loadPlatform()
      expect(isWayland()).toBe(false)
    })
  })

  describe('hasCommand', () => {
    it('returns true when execFileSync succeeds', async () => {
      const { execFileSync } = await import('child_process')
      vi.mocked(execFileSync).mockImplementation(() => Buffer.from(''))
      const { hasCommand } = await loadPlatform()
      expect(hasCommand('xdotool')).toBe(true)
    })

    it('returns false when execFileSync throws', async () => {
      const { execFileSync } = await import('child_process')
      vi.mocked(execFileSync).mockImplementation(() => { throw new Error('not found') })
      const { hasCommand } = await loadPlatform()
      expect(hasCommand('xdotool')).toBe(false)
    })
  })

  describe('hasXdotool / hasWlCopy', () => {
    it('hasXdotool calls hasCommand with "xdotool"', async () => {
      const { execFileSync } = await import('child_process')
      vi.mocked(execFileSync).mockImplementation(() => Buffer.from(''))
      const { hasXdotool } = await loadPlatform()
      expect(hasXdotool()).toBe(true)
    })

    it('hasWlCopy calls hasCommand with "wl-copy"', async () => {
      const { execFileSync } = await import('child_process')
      vi.mocked(execFileSync).mockImplementation(() => Buffer.from(''))
      const { hasWlCopy } = await loadPlatform()
      expect(hasWlCopy()).toBe(true)
    })
  })
})
