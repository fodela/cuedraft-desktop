import { app } from 'electron'
import { join } from 'path'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'fs'
import type { Settings } from '../../shared/types'
import { SETTINGS_DEFAULTS } from '../../shared/default-settings'
import { sanitizeStoredSettings, validateSettingsPatch } from '../validation'

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function writeSettingsFile(settings: Settings): void {
  const path = getSettingsPath()
  const tempPath = `${path}.tmp`
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(tempPath, JSON.stringify(settings, null, 2), 'utf-8')
  renameSync(tempPath, path)
}

function preserveCorruptSettingsFile(path: string): void {
  if (!existsSync(path)) return

  try {
    renameSync(path, `${path}.corrupt-${Date.now()}`)
  } catch (error) {
    console.warn('[settings] failed to preserve corrupt settings file', error)
  }
}

export function getSettings(): Settings {
  const path = getSettingsPath()
  if (!existsSync(path)) return { ...SETTINGS_DEFAULTS }

  try {
    const raw = readFileSync(path, 'utf-8')
    const stored = sanitizeStoredSettings(JSON.parse(raw))
    return { ...SETTINGS_DEFAULTS, ...stored }
  } catch (error) {
    console.warn('[settings] failed to read settings, falling back to defaults', error)
    preserveCorruptSettingsFile(path)
    return { ...SETTINGS_DEFAULTS }
  }
}

export function setSettings(partial: Partial<Settings>): Settings {
  const current = getSettings()
  const sanitizedPartial = validateSettingsPatch(partial)
  const merged = { ...current, ...sanitizedPartial }
  writeSettingsFile(merged)
  return merged
}

export function resetSettings(): Settings {
  writeSettingsFile(SETTINGS_DEFAULTS)
  return { ...SETTINGS_DEFAULTS }
}
