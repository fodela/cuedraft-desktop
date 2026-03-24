import { useState, useEffect, useCallback } from 'react'
import type { Settings } from '../../shared/types'
import { applyAllSettings } from '../theme'

type Theme = Settings['theme']
type FontFamily = Settings['font']
type BorderRadius = Settings['borderRadius']
type AccentColor = Settings['accentColor']

const ACCENTS: { id: AccentColor; label: string; hex: string; tw: string }[] = [
  { id: 'black',  label: 'Black',  hex: '#71717a', tw: 'bg-zinc-500' },
  { id: 'purple', label: 'Purple', hex: '#a855f7', tw: 'bg-purple-500' },
  { id: 'blue',   label: 'Blue',   hex: '#3b82f6', tw: 'bg-blue-500' },
  { id: 'pink',   label: 'Pink',   hex: '#ec4899', tw: 'bg-pink-500' },
  { id: 'violet', label: 'Violet', hex: '#8b5cf6', tw: 'bg-violet-500' },
  { id: 'indigo', label: 'Indigo', hex: '#6366f1', tw: 'bg-indigo-500' },
  { id: 'orange', label: 'Orange', hex: '#f97316', tw: 'bg-orange-500' },
  { id: 'teal',   label: 'Teal',   hex: '#14b8a6', tw: 'bg-teal-500' },
  { id: 'bronze', label: 'Bronze', hex: '#b45309', tw: 'bg-amber-700' },
  { id: 'mint',   label: 'Mint',   hex: '#34d399', tw: 'bg-emerald-400' },
]

const THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark',  label: 'Dark' },
  { id: 'auto',  label: 'Auto' },
]

/** Mini preview card matching the screenshot — Light / Dark / Auto split */
function ThemeCard({ id, accentHex }: { id: Theme; accentHex: string }) {
  const accent = accentHex

  if (id === 'light') {
    return (
      <div className="w-full h-full bg-[#e4eaf2] flex rounded-[inherit] overflow-hidden">
        <div className="w-[32%] bg-[#f0f4f8] flex flex-col gap-1 p-1.5 pt-2 border-r border-black/5">
          <div className="w-4 h-4 rounded mb-1" style={{ background: accent }} />
          <div className="h-1 bg-[#c8cdd5] rounded-full w-4/5" />
          <div className="h-1 bg-[#c8cdd5] rounded-full w-3/5" />
          <div className="h-1 bg-[#c8cdd5] rounded-full w-4/5" />
        </div>
        <div className="flex-1 flex flex-col gap-1.5 p-2 pt-2">
          <div className="h-1.5 bg-[#b0b8c4] rounded-full w-4/5" />
          <div className="h-1.5 bg-[#c4ccd4] rounded-full w-3/5" />
          <div className="h-1.5 bg-[#c4ccd4] rounded-full w-4/5" />
          <div className="h-1.5 bg-[#c4ccd4] rounded-full w-2/5" />
          <div className="mt-auto flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: accent }} />
            <div className="h-1 rounded-full w-8" style={{ background: `${accent}60` }} />
          </div>
        </div>
      </div>
    )
  }

  if (id === 'dark') {
    return (
      <div className="w-full h-full bg-[#0f1825] flex rounded-[inherit] overflow-hidden">
        <div className="w-[32%] bg-[#0b1424] flex flex-col gap-1 p-1.5 pt-2 border-r border-white/5">
          <div className="w-4 h-4 rounded mb-1" style={{ background: accent }} />
          <div className="h-1 bg-[#2a3348] rounded-full w-4/5" />
          <div className="h-1 bg-[#2a3348] rounded-full w-3/5" />
          <div className="h-1 bg-[#2a3348] rounded-full w-4/5" />
        </div>
        <div className="flex-1 flex flex-col gap-1.5 p-2 pt-2">
          <div className="h-1.5 bg-[#3a4560] rounded-full w-4/5" />
          <div className="h-1.5 bg-[#2e3850] rounded-full w-3/5" />
          <div className="h-1.5 bg-[#2e3850] rounded-full w-4/5" />
          <div className="h-1.5 bg-[#2e3850] rounded-full w-2/5" />
          <div className="mt-auto flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: accent }} />
            <div className="h-1 rounded-full w-8" style={{ background: `${accent}60` }} />
          </div>
        </div>
      </div>
    )
  }

  // auto — left half light, right half dark, matching the screenshot
  return (
    <div className="w-full h-full flex rounded-[inherit] overflow-hidden">
      <div className="w-1/2 bg-[#e4eaf2] flex flex-col gap-1 p-1.5 pt-2 border-r border-black/5">
        <div className="w-3 h-3 rounded mb-1" style={{ background: accent }} />
        <div className="h-1 bg-[#c8cdd5] rounded-full w-4/5" />
        <div className="h-1 bg-[#c8cdd5] rounded-full w-3/5" />
        <div className="flex-1 flex items-end">
          <div className="h-1.5 bg-[#c8cdd5] rounded-full w-4/5" />
        </div>
      </div>
      <div className="w-1/2 bg-[#0f1825] flex flex-col gap-1 p-1.5 pt-2">
        <div className="w-3 h-3 rounded mb-1" style={{ background: accent }} />
        <div className="h-1 bg-[#2a3348] rounded-full w-4/5" />
        <div className="h-1 bg-[#2a3348] rounded-full w-3/5" />
        <div className="flex-1 flex items-end">
          <div className="h-1.5 bg-[#2a3348] rounded-full w-4/5" />
        </div>
      </div>
    </div>
  )
}

const FONTS: { id: FontFamily; label: string }[] = [
  { id: 'inter',          label: 'Inter (Standard)' },
  { id: 'geist',          label: 'Geist (Modern)' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono (Mono)' },
  { id: 'system-ui',      label: 'System UI (Native)' },
]

const RADII: { id: BorderRadius; label: string; px: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'sharp', label: 'Sharp', px: '0px', desc: 'Professional / Industrial',
    icon: (
      <svg className="w-6 h-6 text-t3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" strokeWidth={1.5} />
      </svg>
    ),
  },
  {
    id: 'subtle', label: 'Subtle', px: '4px', desc: 'Balanced (Default)',
    icon: (
      <svg className="w-6 h-6 text-t2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="4" strokeWidth={1.5} />
      </svg>
    ),
  },
  {
    id: 'round', label: 'Round', px: '12px', desc: 'Organic / Consumer',
    icon: (
      <svg className="w-6 h-6 text-t3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="8" strokeWidth={1.5} />
      </svg>
    ),
  },
]

export function AppearanceScreen() {
  const [saved, setSaved] = useState<Settings | null>(null)
  const [draft, setDraft] = useState<Settings | null>(null)

  useEffect(() => {
    window.cuedraft.settings.get().then((s) => {
      setSaved(s)
      setDraft(s)
    })
  }, [])

  // Live-preview ALL appearance settings whenever draft changes
  useEffect(() => {
    if (draft) applyAllSettings(draft)
  }, [draft?.theme, draft?.accentColor, draft?.font, draft?.windowOpacity, draft?.borderRadius])

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : null))
  }, [])

  const save = useCallback(async () => {
    if (!draft) return
    const result = await window.cuedraft.settings.set(draft)
    setSaved(result)
    setDraft(result)
  }, [draft])

  const discard = useCallback(() => {
    setDraft(saved)
    if (saved) applyAllSettings(saved)
  }, [saved])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') discard()
      if (e.key === 'F5') { e.preventDefault(); save() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [discard, save])

  if (!draft || !saved) return null

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const selectedFont = FONTS.find((f) => f.id === draft.font) ?? FONTS[0]!
  const accentHex = ACCENTS.find((a) => a.id === draft.accentColor)?.hex ?? '#14b8a6'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 min-h-0">

        {/* ── Visual Interface (theme selector) ── */}
        <section>
          <h2 className="text-[11px] font-bold tracking-widest uppercase text-t2 mb-1">
            Visual Interface
          </h2>
          <p className="text-xs text-t3 mb-4">
            Configure the primary aesthetic engine of the workstation.
          </p>
          <div className="flex gap-5">
            {THEMES.map((t) => {
              const active = draft.theme === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => update('theme', t.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-[110px] h-[74px] rounded-xl overflow-hidden transition-all ${
                      active
                        ? 'ring-2 ring-offset-2 ring-offset-transparent ring-accent'
                        : 'ring-1 ring-mid opacity-70 group-hover:opacity-100 group-hover:ring-2 group-hover:ring-mid'
                    }`}
                    style={active ? { '--tw-ring-color': 'var(--c-accent)' } as React.CSSProperties : {}}
                  >
                    <ThemeCard id={t.id} accentHex={accentHex} />
                  </div>
                  <span className={`text-xs font-medium transition-colors ${
                    active ? 'text-t1' : 'text-t3 group-hover:text-t2'
                  }`}>
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Typography + Glass ── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Typography Foundry */}
          <section className="bg-surface rounded-xl border border-low p-5 relative overflow-hidden">
            <span className="absolute right-4 top-2 text-[64px] font-bold text-t1 opacity-[0.03] select-none leading-none">
              Tr
            </span>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-t2 mb-4">
              Typography Foundry
            </h3>
            <label className="block text-[10px] tracking-wider uppercase text-t3 mb-2">
              Interface Font
            </label>
            <div className="relative mb-4">
              <select
                value={draft.font}
                onChange={(e) => update('font', e.target.value as FontFamily)}
                className="w-full appearance-none bg-base border border-mid text-t2 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent cursor-pointer"
              >
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-t3 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-base border border-low rounded-lg px-3 py-2.5">
                <p className="text-xs font-semibold text-t1 mb-1">
                  {selectedFont.label.split(' (')[0]} Regular
                </p>
                <p className="text-[11px] text-t3">
                  The quick brown fox jumps over the lazy dog. 0123456789
                </p>
              </div>
              <div className="w-14 bg-base border border-low rounded-lg flex flex-col items-center justify-center gap-0.5">
                <span className="text-base font-semibold text-t1">Aa</span>
                <span className="text-[9px] tracking-widest uppercase text-t4">Preview</span>
              </div>
            </div>
          </section>

          {/* Glass Transmission */}
          <section className="bg-surface rounded-xl border border-low p-5">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-t2 mb-4">
              Glass Transmission
            </h3>
            <label className="block text-[10px] tracking-wider uppercase text-t3 mb-2">
              Window Opacity
            </label>
            <div className="flex items-end justify-between mb-6">
              <span className="text-3xl font-semibold text-t1">{draft.windowOpacity}%</span>
              <svg className="w-6 h-6 text-t3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 3C8 3 5 7.5 5 12c0 3.866 3.134 7 7 7s7-3.134 7-7c0-4.5-3-9-7-9z" />
              </svg>
            </div>
            <input
              type="range"
              min={60}
              max={100}
              value={draft.windowOpacity}
              onChange={(e) => update('windowOpacity', Number(e.target.value))}
              className="w-full h-1 appearance-none bg-raised rounded-full cursor-pointer"
              style={{ accentColor: 'var(--c-accent)' }}
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-t4">60%</span>
              <span className="text-[10px] text-t4">80%</span>
              <span className="text-[10px] text-t4">100%</span>
            </div>
          </section>
        </div>

        {/* ── Structural Geometry + Accent Color ── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Structural Geometry */}
          <section>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-t2 mb-3">
              Structural Geometry
            </h3>
            <div className="space-y-2">
              {RADII.map((r) => {
                const active = draft.borderRadius === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => update('borderRadius', r.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border text-left transition-colors ${
                      active
                        ? 'border-accent bg-accent-dim'
                        : 'border-low bg-surface hover:border-mid'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        active ? 'border-accent' : 'border-mid'
                      }`}
                    >
                      {active && <div className="w-2 h-2 rounded-full bg-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${active ? 'text-t1' : 'text-t2'}`}>
                        {r.label}
                      </p>
                      <p className="text-[11px] text-t4">
                        {r.px} · {r.desc}
                      </p>
                    </div>
                    <div className="flex-shrink-0">{r.icon}</div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Accent Color */}
          <section>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-t2 mb-3">
              Accent Color
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {ACCENTS.map((a) => {
                const active = draft.accentColor === a.id
                return (
                  <button
                    key={a.id}
                    onClick={() => update('accentColor', a.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      active
                        ? 'border-accent bg-accent-dim'
                        : 'border-low bg-surface hover:border-mid'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-sm shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: a.hex }}
                    >
                      {active && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-xs font-medium ${active ? 'text-t1' : 'text-t2'}`}>
                      {a.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-low shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dirty ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className="text-[10px] tracking-widest uppercase text-t3">
            {dirty ? 'Unsaved changes — preview active' : 'Config Synchronized'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={discard}
            className="px-4 py-1.5 text-xs text-t2 hover:text-t1 transition-colors tracking-wide uppercase"
          >
            Discard
          </button>
          <button
            onClick={dirty ? save : undefined}
            className={`px-5 py-1.5 text-xs font-semibold rounded-lg tracking-wide uppercase transition-colors ${
              dirty
                ? 'bg-accent text-white cursor-pointer hover:opacity-90'
                : 'bg-accent-dim text-t3 cursor-default'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
