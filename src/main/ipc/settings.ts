import { ipcMain, app } from 'electron'
import { IPC } from '../../shared/types'
import * as settingsStore from '../db/settings-store'
import { registerHotkey } from '../hotkey'
import { togglePicker } from '../windows'
import type { Settings } from '../../shared/types'
import { validateSettingsPatch } from '../validation'
import { syncTrayVisibility } from '../tray'

function applyRuntimeSideEffects(previous: Settings, updated: Settings): Settings {
  let effective = updated

  if (updated.hotkey !== previous.hotkey) {
    const success = registerHotkey(updated.hotkey, () => togglePicker())
    if (!success) {
      settingsStore.setSettings({ hotkey: previous.hotkey })
      registerHotkey(previous.hotkey, () => togglePicker())
      effective = settingsStore.getSettings()
    }
  }

  if (effective.launchAtStartup !== previous.launchAtStartup) {
    app.setLoginItemSettings({ openAtLogin: effective.launchAtStartup })
  }

  if (effective.showInTray !== previous.showInTray) {
    syncTrayVisibility(effective.showInTray)
  }

  return effective
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return settingsStore.getSettings()
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_event, partial) => {
    const previous = settingsStore.getSettings()
    const sanitizedPartial = validateSettingsPatch(partial)
    const updated = settingsStore.setSettings(sanitizedPartial)
    return applyRuntimeSideEffects(previous, updated)
  })

  ipcMain.handle(IPC.SETTINGS_RESET, () => {
    const previous = settingsStore.getSettings()
    const updated = settingsStore.resetSettings()
    return applyRuntimeSideEffects(previous, updated)
  })
}
