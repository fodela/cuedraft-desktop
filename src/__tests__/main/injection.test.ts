import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { injectText } from '../../main/injection'

// Mock these before any imports so injection.ts sees the mocks
vi.mock('child_process', () => ({ execSync: vi.fn() }))
vi.mock('@jitsi/robotjs', () => ({
  keyTap: vi.fn(),
  keyToggle: vi.fn(),
  typeString: vi.fn(),
  setKeyboardDelay: vi.fn(),
}))

function setPlatform(p: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { value: p, writable: true })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  delete process.env.WAYLAND_DISPLAY
  delete process.env.ELECTRON_OZONE_PLATFORM_HINT
})

afterEach(() => {
  vi.useRealTimers()
})

describe('injection', () => {
  describe('sanitize (via injectText)', () => {
    it('strips null bytes from content before typing', async () => {
      setPlatform('linux')
      const robotjs = await import('@jitsi/robotjs')
      const promise = injectText('hello\0world')
      await vi.runAllTimersAsync()
      await promise
      const typeStringCalls = vi.mocked(robotjs.typeString).mock.calls
      for (const [arg] of typeStringCalls) {
        expect(arg).not.toContain('\0')
      }
    })

    it('truncates content longer than 10,000 characters', async () => {
      setPlatform('linux')
      const { clipboard } = await import('electron')
      const longText = 'a'.repeat(15_000)
      const promise = injectText(longText)
      await vi.runAllTimersAsync()
      await promise
      // Long text → clipboard path; any write call should not exceed 10,000 chars
      expect(
        vi.mocked(clipboard.writeText).mock.calls.every(([t]) => t.length <= 10_000)
      ).toBe(true)
    })
  })

  describe('linux-x11 routing', () => {
    beforeEach(() => {
      setPlatform('linux')
      delete process.env.WAYLAND_DISPLAY
    })

    it('calls robotjs.typeString for short text', async () => {
      const robotjs = await import('@jitsi/robotjs')
      const promise = injectText('short text')
      await vi.runAllTimersAsync()
      await promise
      expect(robotjs.typeString).toHaveBeenCalledWith('short text')
    })

    it('falls back to clipboard when both robotjs and xdotool fail', async () => {
      const robotjs = await import('@jitsi/robotjs')
      const { execSync } = await import('child_process')
      const { clipboard } = await import('electron')
      vi.mocked(robotjs.typeString).mockImplementation(() => { throw new Error('fail') })
      vi.mocked(execSync).mockImplementation(() => { throw new Error('no tool') })
      const promise = injectText('short text')
      await vi.runAllTimersAsync()
      await promise
      expect(clipboard.writeText).toHaveBeenCalledWith('short text')
    })

    it('uses clipboard paste for long text (>100 chars)', async () => {
      const { clipboard } = await import('electron')
      const longText = 'a'.repeat(101)
      const promise = injectText(longText)
      await vi.runAllTimersAsync()
      await promise
      expect(clipboard.writeText).toHaveBeenCalledWith(longText)
    })
  })

  describe('linux-wayland routing', () => {
    beforeEach(() => {
      setPlatform('linux')
      process.env.WAYLAND_DISPLAY = 'wayland-0'
    })

    afterEach(() => {
      delete process.env.WAYLAND_DISPLAY
    })

    it('calls execSync with wl-copy when available', async () => {
      const { execSync } = await import('child_process')
      vi.mocked(execSync).mockImplementation(() => Buffer.from(''))
      const promise = injectText('short')
      await vi.runAllTimersAsync()
      await promise
      const calls = vi.mocked(execSync).mock.calls.map((c) => String(c[0]))
      expect(calls.some((c) => c.includes('wl-copy'))).toBe(true)
    })

    it('falls back to clipboard.writeText when wl-copy is not available', async () => {
      const { execSync } = await import('child_process')
      const { clipboard } = await import('electron')
      vi.mocked(execSync).mockImplementation(() => { throw new Error('not found') })
      const promise = injectText('short')
      await vi.runAllTimersAsync()
      await promise
      expect(clipboard.writeText).toHaveBeenCalledWith('short')
    })
  })

  describe('win32 routing', () => {
    beforeEach(() => setPlatform('win32'))

    it('calls robotjs.typeString for short text on win32', async () => {
      const robotjs = await import('@jitsi/robotjs')
      const promise = injectText('hello')
      await vi.runAllTimersAsync()
      await promise
      expect(robotjs.typeString).toHaveBeenCalledWith('hello')
    })

    it('falls back to clipboard when robotjs fails on win32', async () => {
      const robotjs = await import('@jitsi/robotjs')
      const { clipboard } = await import('electron')
      vi.mocked(robotjs.typeString).mockImplementation(() => { throw new Error('fail') })
      const promise = injectText('hello')
      await vi.runAllTimersAsync()
      await promise
      expect(clipboard.writeText).toHaveBeenCalledWith('hello')
    })
  })

  describe('timer behavior', () => {
    it('does not inject before 80ms', async () => {
      setPlatform('linux')
      const robotjs = await import('@jitsi/robotjs')
      injectText('hi')
      await vi.advanceTimersByTimeAsync(79)
      expect(robotjs.typeString).not.toHaveBeenCalled()
      await vi.runAllTimersAsync()
    })

    it('injects after 80ms delay', async () => {
      setPlatform('linux')
      const robotjs = await import('@jitsi/robotjs')
      const promise = injectText('hi')
      await vi.advanceTimersByTimeAsync(80)
      await promise
      expect(robotjs.typeString).toHaveBeenCalled()
    })
  })
})
