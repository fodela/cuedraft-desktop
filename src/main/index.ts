import { app } from 'electron'
import { syncTrayVisibility } from './tray'
import { createPickerWindow, togglePicker } from './windows'
import { registerHotkey, unregisterHotkey } from './hotkey'
import { getDatabase, closeDatabase } from './db/database'
import { registerTemplateHandlers } from './ipc/templates'
import { registerSettingsHandlers } from './ipc/settings'
import { registerNoteHandlers } from './ipc/notes'
import { getSettings } from './db/settings-store'
import { setupAutoUpdater } from './updater'

app.whenReady().then(() => {
  // Initialize database (creates schema + seed data on first launch)
  getDatabase()

  // Register IPC handlers
  registerTemplateHandlers()
  registerSettingsHandlers()
  registerNoteHandlers()

  const settings = getSettings()

  // Create tray and picker window
  syncTrayVisibility(settings.showInTray)
  createPickerWindow()

  // Register global hotkey
  const registered = registerHotkey(settings.hotkey, () => {
    togglePicker()
  })

  if (!registered) {
    console.error(`Failed to register global hotkey: ${settings.hotkey}`)
  }

  // Check for updates in the background (no-op in dev and on unsigned macOS)
  setupAutoUpdater()
})

app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})

app.on('will-quit', () => {
  unregisterHotkey()
  closeDatabase()
})
