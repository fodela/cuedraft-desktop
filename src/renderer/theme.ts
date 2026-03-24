import type { Settings } from '../shared/types'

const ACCENTS: Record<Settings['accentColor'], string> = {
  black:  '#71717a',
  purple: '#a855f7',
  blue:   '#3b82f6',
  pink:   '#ec4899',
  violet: '#8b5cf6',
  indigo: '#6366f1',
  orange: '#f97316',
  teal:   '#14b8a6',
  bronze: '#b45309',
  mint:   '#34d399',
}

const FONTS: Record<Settings['font'], string> = {
  'inter':          'Inter, ui-sans-serif, system-ui, sans-serif',
  'geist':          'Geist, ui-sans-serif, system-ui, sans-serif',
  'jetbrains-mono': "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
  'system-ui':      'system-ui, ui-sans-serif, sans-serif',
}

export function applyTheme(theme: Settings['theme'], accentColor: Settings['accentColor']): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  const hex = ACCENTS[accentColor] ?? ACCENTS.teal
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  root.style.setProperty('--c-accent', hex)
  root.style.setProperty('--c-adim', `rgba(${r},${g},${b},0.15)`)
}

export function applyAppearance(
  settings: Pick<Settings, 'font' | 'windowOpacity' | 'borderRadius'>
): void {
  const root = document.documentElement
  root.style.setProperty('--c-font', FONTS[settings.font] ?? FONTS['system-ui']!)
  root.setAttribute('data-radius', settings.borderRadius)
  root.style.opacity = String(settings.windowOpacity / 100)
}

export function applyAllSettings(settings: Settings): void {
  applyTheme(settings.theme, settings.accentColor)
  applyAppearance(settings)
}
