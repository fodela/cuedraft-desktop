/* @vitest-environment happy-dom */
import { describe, it, expect, beforeEach } from 'vitest'
import { applyTheme, applyAppearance, applyAllSettings } from '../../renderer/theme'
import type { Settings } from '../../shared/types'

function root() {
  return document.documentElement
}

function resetRoot() {
  root().removeAttribute('data-theme')
  root().removeAttribute('data-radius')
  root().style.removeProperty('--c-accent')
  root().style.removeProperty('--c-adim')
  root().style.removeProperty('--c-font')
  root().style.opacity = ''
}

// Minimal valid Settings object for applyAllSettings
const BASE_SETTINGS: Settings = {
  theme: 'dark',
  accentColor: 'teal',
  font: 'inter',
  windowOpacity: 100,
  borderRadius: 'subtle',
  hotkey: 'Ctrl+Shift+Space',
  launchAtStartup: false,
  showInTray: true,
  injectionMethod: 'auto',
  privacyMode: false,
  vimMode: false,
}

// ── applyTheme ──────────────────────────────────────────────────────────────

describe('applyTheme', () => {
  beforeEach(resetRoot)

  it('sets data-theme to dark', () => {
    applyTheme('dark', 'teal')
    expect(root().getAttribute('data-theme')).toBe('dark')
  })

  it('sets data-theme to light', () => {
    applyTheme('light', 'teal')
    expect(root().getAttribute('data-theme')).toBe('light')
  })

  it('sets data-theme to auto', () => {
    applyTheme('auto', 'teal')
    expect(root().getAttribute('data-theme')).toBe('auto')
  })

  it('sets --c-accent for teal', () => {
    applyTheme('dark', 'teal')
    expect(root().style.getPropertyValue('--c-accent')).toBe('#14b8a6')
  })

  it('sets --c-accent for blue', () => {
    applyTheme('dark', 'blue')
    expect(root().style.getPropertyValue('--c-accent')).toBe('#3b82f6')
  })

  it('sets --c-accent for purple', () => {
    applyTheme('dark', 'purple')
    expect(root().style.getPropertyValue('--c-accent')).toBe('#a855f7')
  })

  it('sets --c-adim as rgba derived from accent hex', () => {
    applyTheme('dark', 'teal') // #14b8a6 → r=20, g=184, b=166
    expect(root().style.getPropertyValue('--c-adim')).toBe('rgba(20,184,166,0.15)')
  })

  it('sets --c-adim correctly for orange (#f97316)', () => {
    applyTheme('dark', 'orange') // r=249, g=115, b=22
    expect(root().style.getPropertyValue('--c-adim')).toBe('rgba(249,115,22,0.15)')
  })

  it('handles every accent color without throwing', () => {
    const colors: Settings['accentColor'][] = [
      'black', 'purple', 'blue', 'pink', 'violet',
      'indigo', 'orange', 'teal', 'bronze', 'mint',
    ]
    for (const color of colors) {
      expect(() => applyTheme('dark', color)).not.toThrow()
    }
  })
})

// ── applyAppearance ─────────────────────────────────────────────────────────

describe('applyAppearance', () => {
  beforeEach(resetRoot)

  it('sets data-radius to sharp', () => {
    applyAppearance({ font: 'inter', windowOpacity: 100, borderRadius: 'sharp' })
    expect(root().getAttribute('data-radius')).toBe('sharp')
  })

  it('sets data-radius to subtle', () => {
    applyAppearance({ font: 'inter', windowOpacity: 100, borderRadius: 'subtle' })
    expect(root().getAttribute('data-radius')).toBe('subtle')
  })

  it('sets data-radius to round', () => {
    applyAppearance({ font: 'inter', windowOpacity: 100, borderRadius: 'round' })
    expect(root().getAttribute('data-radius')).toBe('round')
  })

  it('sets --c-font containing "Inter" for inter', () => {
    applyAppearance({ font: 'inter', windowOpacity: 100, borderRadius: 'subtle' })
    expect(root().style.getPropertyValue('--c-font')).toContain('Inter')
  })

  it('sets --c-font containing "Geist" for geist', () => {
    applyAppearance({ font: 'geist', windowOpacity: 100, borderRadius: 'subtle' })
    expect(root().style.getPropertyValue('--c-font')).toContain('Geist')
  })

  it('sets --c-font containing "JetBrains Mono" for jetbrains-mono', () => {
    applyAppearance({ font: 'jetbrains-mono', windowOpacity: 100, borderRadius: 'subtle' })
    expect(root().style.getPropertyValue('--c-font')).toContain('JetBrains Mono')
  })

  it('sets --c-font containing "system-ui" for system-ui', () => {
    applyAppearance({ font: 'system-ui', windowOpacity: 100, borderRadius: 'subtle' })
    expect(root().style.getPropertyValue('--c-font')).toContain('system-ui')
  })

  it('sets opacity to 1 when windowOpacity is 100', () => {
    applyAppearance({ font: 'inter', windowOpacity: 100, borderRadius: 'subtle' })
    expect(root().style.opacity).toBe('1')
  })

  it('sets opacity to 0.8 when windowOpacity is 80', () => {
    applyAppearance({ font: 'inter', windowOpacity: 80, borderRadius: 'subtle' })
    expect(root().style.opacity).toBe('0.8')
  })

  it('sets opacity to 0.6 when windowOpacity is 60', () => {
    applyAppearance({ font: 'inter', windowOpacity: 60, borderRadius: 'subtle' })
    expect(root().style.opacity).toBe('0.6')
  })
})

// ── applyAllSettings ────────────────────────────────────────────────────────

describe('applyAllSettings', () => {
  beforeEach(resetRoot)

  it('applies theme and accent from settings', () => {
    applyAllSettings({ ...BASE_SETTINGS, theme: 'light', accentColor: 'indigo' })
    expect(root().getAttribute('data-theme')).toBe('light')
    expect(root().style.getPropertyValue('--c-accent')).toBe('#6366f1')
  })

  it('applies font and border radius from settings', () => {
    applyAllSettings({ ...BASE_SETTINGS, font: 'geist', borderRadius: 'round' })
    expect(root().getAttribute('data-radius')).toBe('round')
    expect(root().style.getPropertyValue('--c-font')).toContain('Geist')
  })

  it('applies opacity from settings', () => {
    applyAllSettings({ ...BASE_SETTINGS, windowOpacity: 75 })
    expect(root().style.opacity).toBe('0.75')
  })

  it('applies all five settings in a single call', () => {
    applyAllSettings({
      ...BASE_SETTINGS,
      theme: 'auto',
      accentColor: 'mint',
      font: 'jetbrains-mono',
      windowOpacity: 90,
      borderRadius: 'sharp',
    })
    expect(root().getAttribute('data-theme')).toBe('auto')
    expect(root().getAttribute('data-radius')).toBe('sharp')
    expect(root().style.getPropertyValue('--c-accent')).toBe('#34d399')
    expect(root().style.getPropertyValue('--c-font')).toContain('JetBrains Mono')
    expect(root().style.opacity).toBe('0.9')
  })
})
