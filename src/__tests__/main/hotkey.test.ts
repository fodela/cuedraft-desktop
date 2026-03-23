import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('hotkey', () => {
  let registerHotkey: (acc: string, cb: () => void) => boolean
  let unregisterHotkey: () => void
  let globalShortcut: { register: ReturnType<typeof vi.fn>; unregister: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    vi.resetModules()
    const electron = await import('electron')
    globalShortcut = electron.globalShortcut as typeof globalShortcut
    vi.mocked(globalShortcut.register).mockReturnValue(true)
    const mod = await import('../../main/hotkey')
    registerHotkey = mod.registerHotkey
    unregisterHotkey = mod.unregisterHotkey
  })

  describe('registerHotkey', () => {
    it('calls globalShortcut.register with the given accelerator', () => {
      const cb = vi.fn()
      registerHotkey('Ctrl+Shift+Space', cb)
      expect(globalShortcut.register).toHaveBeenCalledWith('Ctrl+Shift+Space', cb)
    })

    it('returns true when registration succeeds', () => {
      vi.mocked(globalShortcut.register).mockReturnValue(true)
      expect(registerHotkey('Ctrl+Shift+Space', vi.fn())).toBe(true)
    })

    it('returns false when registration fails', () => {
      vi.mocked(globalShortcut.register).mockReturnValue(false)
      expect(registerHotkey('Ctrl+Shift+Space', vi.fn())).toBe(false)
    })

    it('unregisters previous hotkey before registering new one', () => {
      vi.mocked(globalShortcut.register).mockReturnValue(true)
      registerHotkey('Ctrl+Shift+Space', vi.fn())
      vi.mocked(globalShortcut.unregister).mockClear()
      registerHotkey('Ctrl+Alt+T', vi.fn())
      expect(globalShortcut.unregister).toHaveBeenCalledWith('Ctrl+Shift+Space')
    })
  })

  describe('unregisterHotkey', () => {
    it('calls globalShortcut.unregister with stored accelerator', () => {
      vi.mocked(globalShortcut.register).mockReturnValue(true)
      registerHotkey('Ctrl+Shift+Space', vi.fn())
      vi.mocked(globalShortcut.unregister).mockClear()
      unregisterHotkey()
      expect(globalShortcut.unregister).toHaveBeenCalledWith('Ctrl+Shift+Space')
    })

    it('does not throw when no hotkey is registered', () => {
      expect(() => unregisterHotkey()).not.toThrow()
    })

    it('does not call unregister when no hotkey is registered', () => {
      vi.mocked(globalShortcut.unregister).mockClear()
      unregisterHotkey()
      expect(globalShortcut.unregister).not.toHaveBeenCalled()
    })
  })
})
