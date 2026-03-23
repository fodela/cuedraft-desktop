import { ipcMain, app } from 'electron'
import { IPC } from '../../shared/types'
import * as settingsStore from '../db/settings-store'
import { registerHotkey } from '../hotkey'
import { togglePicker } from '../windows'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return settingsStore.getSettings()
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_event, partial) => {
    const previous = settingsStore.getSettings()
    const updated = settingsStore.setSettings(partial)

    // Re-register hotkey if changed
    if (partial.hotkey && partial.hotkey !== previous.hotkey) {
      const success = registerHotkey(updated.hotkey, () => togglePicker())
      if (!success) {
        settingsStore.setSettings({ hotkey: previous.hotkey })
        registerHotkey(previous.hotkey, () => togglePicker())
        return settingsStore.getSettings()
      }
    }

    // Update launch at startup if changed
    if (partial.launchAtStartup !== undefined) {
      app.setLoginItemSettings({ openAtLogin: updated.launchAtStartup })
    }

    return updated
  })

  ipcMain.handle(IPC.SETTINGS_RESET, () => {
    return settingsStore.resetSettings()
  })
}
