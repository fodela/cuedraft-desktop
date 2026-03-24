import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
}))

describe('settings-store', () => {
  let getSettings: () => import('../../shared/types').Settings
  let setSettings: (p: Partial<import('../../shared/types').Settings>) => import('../../shared/types').Settings
  let resetSettings: () => import('../../shared/types').Settings

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../../main/db/settings-store')
    getSettings = mod.getSettings
    setSettings = mod.setSettings
    resetSettings = mod.resetSettings
  })

  const DEFAULTS = {
    hotkey: 'Ctrl+Shift+Space',
    injectionMethod: 'auto',
    launchAtStartup: false,
    showInTray: true,
    privacyMode: true,
    vimMode: false,
    theme: 'dark',
    accentColor: 'teal',
    windowOpacity: 92,
    borderRadius: 'subtle',
    font: 'inter',
  }

  describe('getSettings', () => {
    it('returns DEFAULTS when settings file does not exist', async () => {
      const { existsSync } = await import('fs')
      vi.mocked(existsSync).mockReturnValue(false)
      expect(getSettings()).toMatchObject(DEFAULTS)
    })

    it('returns merged settings when file exists with partial overrides', async () => {
      const { existsSync, readFileSync } = await import('fs')
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ hotkey: 'Ctrl+Alt+T' }))
      const result = getSettings()
      expect(result.hotkey).toBe('Ctrl+Alt+T')
      expect(result.launchAtStartup).toBe(false)
    })

    it('returns DEFAULTS when file contains invalid JSON', async () => {
      const { existsSync, readFileSync } = await import('fs')
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockReturnValue('{ not valid json }')
      expect(getSettings()).toMatchObject(DEFAULTS)
    })
  })

  describe('setSettings', () => {
    it('writes merged settings to file', async () => {
      const { existsSync, readFileSync, writeFileSync } = await import('fs')
      vi.mocked(existsSync).mockReturnValue(false)
      setSettings({ hotkey: 'Ctrl+Alt+T' })
      expect(writeFileSync).toHaveBeenCalled()
      const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string)
      expect(written.hotkey).toBe('Ctrl+Alt+T')
    })

    it('returns the merged Settings object', async () => {
      const { existsSync } = await import('fs')
      vi.mocked(existsSync).mockReturnValue(false)
      const result = setSettings({ hotkey: 'Ctrl+Alt+T' })
      expect(result.hotkey).toBe('Ctrl+Alt+T')
      expect(result.launchAtStartup).toBe(false)
    })

    it('partial update preserves other fields', async () => {
      const { existsSync } = await import('fs')
      vi.mocked(existsSync).mockReturnValue(false)
      const result = setSettings({ vimMode: true })
      expect(result.vimMode).toBe(true)
      expect(result.hotkey).toBe('Ctrl+Shift+Space')
    })
  })

  describe('resetSettings', () => {
    it('writes DEFAULTS to file', async () => {
      const { writeFileSync } = await import('fs')
      resetSettings()
      const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string)
      expect(written).toMatchObject(DEFAULTS)
    })

    it('returns a copy of DEFAULTS', () => {
      const result = resetSettings()
      expect(result).toMatchObject(DEFAULTS)
    })
  })
})
