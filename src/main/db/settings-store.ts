import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { Settings } from '../../shared/types'

const DEFAULTS: Settings = {
  hotkey: 'Ctrl+Shift+Space',
  injectionMethod: 'auto',
  launchAtStartup: false,
  showInTray: true,
  privacyMode: true,
  vimMode: false,
  theme: 'obsidian-dark',
  windowOpacity: 92,
  borderRadius: 'subtle',
  font: 'inter',
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function getSettings(): Settings {
  const path = getSettingsPath()
  if (!existsSync(path)) return { ...DEFAULTS }

  try {
    const raw = readFileSync(path, 'utf-8')
    const stored = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULTS, ...stored }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setSettings(partial: Partial<Settings>): Settings {
  const current = getSettings()
  const merged = { ...current, ...partial }
  writeFileSync(getSettingsPath(), JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}

export function resetSettings(): Settings {
  writeFileSync(getSettingsPath(), JSON.stringify(DEFAULTS, null, 2), 'utf-8')
  return { ...DEFAULTS }
}
