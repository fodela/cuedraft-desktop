import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IPC } from '../../../shared/types'

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

vi.mock('../../../main/db/settings-store', () => ({
  getSettings: vi.fn(() => ({ ...DEFAULTS })),
  setSettings: vi.fn((p: unknown) => ({ ...DEFAULTS, ...(p as object) })),
  resetSettings: vi.fn(() => ({ ...DEFAULTS })),
}))
vi.mock('../../../main/hotkey', () => ({ registerHotkey: vi.fn(() => true) }))
vi.mock('../../../main/windows', () => ({ togglePicker: vi.fn() }))
vi.mock('../../../main/tray', () => ({ syncTrayVisibility: vi.fn() }))

describe('registerSettingsHandlers', () => {
  const handlers = new Map<string, Function>()

  beforeEach(async () => {
    handlers.clear()
    vi.clearAllMocks()

    const electron = await import('electron')
    vi.mocked(electron.ipcMain.handle).mockImplementation((channel: string, fn: Function) => {
      handlers.set(channel, fn)
      return electron.ipcMain
    })

    const { registerSettingsHandlers } = await import('../../../main/ipc/settings')
    registerSettingsHandlers()
  })

  it('registers handlers for SETTINGS_GET, SETTINGS_SET, SETTINGS_RESET', () => {
    expect(handlers.has(IPC.SETTINGS_GET)).toBe(true)
    expect(handlers.has(IPC.SETTINGS_SET)).toBe(true)
    expect(handlers.has(IPC.SETTINGS_RESET)).toBe(true)
  })

  it('SETTINGS_GET returns getSettings()', async () => {
    const store = await import('../../../main/db/settings-store')
    const result = await handlers.get(IPC.SETTINGS_GET)!(null)
    expect(store.getSettings).toHaveBeenCalled()
    expect(result).toMatchObject(DEFAULTS)
  })

  it('SETTINGS_SET calls setSettings and returns updated settings', async () => {
    const store = await import('../../../main/db/settings-store')
    const result = await handlers.get(IPC.SETTINGS_SET)!(null, { vimMode: true })
    expect(store.setSettings).toHaveBeenCalledWith({ vimMode: true })
    expect(result).toMatchObject({ ...DEFAULTS, vimMode: true })
  })

  it('SETTINGS_SET with new hotkey calls registerHotkey', async () => {
    const { registerHotkey } = await import('../../../main/hotkey')
    await handlers.get(IPC.SETTINGS_SET)!(null, { hotkey: 'Ctrl+Alt+T' })
    expect(registerHotkey).toHaveBeenCalledWith('Ctrl+Alt+T', expect.any(Function))
  })

  it('SETTINGS_SET without hotkey change does not call registerHotkey', async () => {
    const { registerHotkey } = await import('../../../main/hotkey')
    await handlers.get(IPC.SETTINGS_SET)!(null, { vimMode: true })
    expect(registerHotkey).not.toHaveBeenCalled()
  })

  it('SETTINGS_SET with launchAtStartup calls app.setLoginItemSettings', async () => {
    const { app } = await import('electron')
    await handlers.get(IPC.SETTINGS_SET)!(null, { launchAtStartup: true })
    expect(app.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true })
  })

  it('SETTINGS_SET without launchAtStartup does not call app.setLoginItemSettings', async () => {
    const { app } = await import('electron')
    await handlers.get(IPC.SETTINGS_SET)!(null, { vimMode: true })
    expect(app.setLoginItemSettings).not.toHaveBeenCalled()
  })

  it('SETTINGS_SET with showInTray calls syncTrayVisibility', async () => {
    const { syncTrayVisibility } = await import('../../../main/tray')
    await handlers.get(IPC.SETTINGS_SET)!(null, { showInTray: false })
    expect(syncTrayVisibility).toHaveBeenCalledWith(false)
  })

  it('SETTINGS_RESET calls resetSettings() and returns defaults', async () => {
    const store = await import('../../../main/db/settings-store')
    const { registerHotkey } = await import('../../../main/hotkey')
    const { app } = await import('electron')
    const result = await handlers.get(IPC.SETTINGS_RESET)!(null)
    expect(store.resetSettings).toHaveBeenCalled()
    expect(registerHotkey).not.toHaveBeenCalled()
    expect(app.setLoginItemSettings).not.toHaveBeenCalled()
    expect(result).toMatchObject(DEFAULTS)
  })
})
