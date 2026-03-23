import { app } from 'electron'
import { createTray } from './tray'
import { createPickerWindow, togglePicker } from './windows'
import { registerHotkey, unregisterHotkey } from './hotkey'
import { getDatabase, closeDatabase } from './db/database'
import { registerTemplateHandlers } from './ipc/templates'
import { registerSettingsHandlers } from './ipc/settings'
import { getSettings } from './db/settings-store'

app.whenReady().then(() => {
  // Initialize database (creates schema + seed data on first launch)
  getDatabase()

  // Register IPC handlers
  registerTemplateHandlers()
  registerSettingsHandlers()

  // Create tray and picker window
  createTray()
  createPickerWindow()

  // Register global hotkey
  const settings = getSettings()
  const registered = registerHotkey(settings.hotkey, () => {
    togglePicker()
  })

  if (!registered) {
    console.error(`Failed to register global hotkey: ${settings.hotkey}`)
  }
})

app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})

app.on('will-quit', () => {
  unregisterHotkey()
  closeDatabase()
})
