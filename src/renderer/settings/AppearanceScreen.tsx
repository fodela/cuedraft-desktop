import { useState, useEffect, useCallback } from 'react'
import type { Settings } from '../../shared/types'

type Theme = Settings['theme']
type FontFamily = Settings['font']
type BorderRadius = Settings['borderRadius']

const THEMES: { id: Theme; label: string; preview: React.ReactNode }[] = [
  {
    id: 'system',
    label: 'System',
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-zinc-300 to-zinc-500 flex">
        <div className="w-1/3 bg-zinc-200/40 border-r border-white/20" />
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1.5 bg-white/30 rounded-sm w-3/4" />
          <div className="h-1.5 bg-white/20 rounded-sm w-1/2" />
          <div className="h-1.5 bg-white/20 rounded-sm w-2/3" />
        </div>
      </div>
    ),
  },
  {
    id: 'light',
    label: 'Light',
    preview: (
      <div className="w-full h-full bg-zinc-100 flex">
        <div className="w-1/3 bg-zinc-200 border-r border-zinc-300" />
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1.5 bg-zinc-400 rounded-sm w-3/4" />
          <div className="h-1.5 bg-zinc-300 rounded-sm w-1/2" />
          <div className="h-1.5 bg-zinc-300 rounded-sm w-2/3" />
        </div>
      </div>
    ),
  },
  {
    id: 'obsidian-dark',
    label: 'Obsidian Dark',
    preview: (
      <div className="w-full h-full bg-[#0b1424] flex">
        <div className="w-1/3 bg-[#070d1a] border-r border-white/10" />
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1.5 bg-zinc-600 rounded-sm w-3/4" />
          <div className="h-1.5 bg-zinc-700 rounded-sm w-1/2" />
          <div className="h-1.5 bg-zinc-700 rounded-sm w-2/3" />
        </div>
      </div>
    ),
  },
  {
    id: 'midnight-blue',
    label: 'Midnight Blue',
    preview: (
      <div className="w-full h-full bg-[#060e1f] flex">
        <div className="w-1/3 bg-[#03080f] border-r border-blue-900/30" />
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1.5 bg-blue-900/60 rounded-sm w-3/4" />
          <div className="h-1.5 bg-blue-900/40 rounded-sm w-1/2" />
          <div className="h-1.5 bg-blue-900/40 rounded-sm w-2/3" />
        </div>
      </div>
    ),
  },
]

const FONTS: { id: FontFamily; label: string }[] = [
  { id: 'inter', label: 'Inter (Standard)' },
  { id: 'geist', label: 'Geist (Modern)' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono (Mono)' },
  { id: 'system-ui', label: 'System UI (Native)' },
]

const RADII: { id: BorderRadius; label: string; px: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'sharp',
    label: 'Sharp',
    px: '0px',
    desc: 'Professional / Industrial',
    icon: (
      <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" strokeWidth={1.5} />
      </svg>
    ),
  },
  {
    id: 'subtle',
    label: 'Subtle',
    px: '4px',
    desc: 'Balanced (Default)',
    icon: (
      <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="4" strokeWidth={1.5} />
      </svg>
    ),
  },
  {
    id: 'round',
    label: 'Round',
    px: '12px',
    desc: 'Organic / Consumer',
    icon: (
      <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  }, [saved])

  // Keyboard shortcuts
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 min-h-0">

        {/* ── Visual Interface ── */}
        <section>
          <h2 className="text-[11px] font-bold tracking-widest uppercase text-zinc-300 mb-1">
            Visual Interface
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            Configure the primary aesthetic engine of the workstation.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {THEMES.map((t) => {
              const active = draft.theme === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => update('theme', t.id)}
                  className="flex flex-col gap-2 text-left group"
                >
                  <div
                    className={`w-full h-[90px] rounded-lg overflow-hidden border-2 transition-colors ${
                      active ? 'border-blue-500' : 'border-white/10 group-hover:border-white/20'
                    }`}
                  >
                    {t.preview}
                  </div>
                  <div className="flex items-center gap-2 px-0.5">
                    <div
                      className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        active ? 'border-blue-500 bg-blue-500' : 'border-zinc-600'
                      }`}
                    >
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-xs ${active ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {t.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Typography + Glass ── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Typography Foundry */}
          <section className="bg-[#0b1424] rounded-xl border border-white/5 p-5 relative overflow-hidden">
            <span className="absolute right-4 top-2 text-[64px] font-bold text-white/[0.04] select-none leading-none">
              Tr
            </span>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-4">
              Typography Foundry
            </h3>
            <label className="block text-[10px] tracking-wider uppercase text-zinc-500 mb-2">
              Interface Font
            </label>
            <div className="relative mb-4">
              <select
                value={draft.font}
                onChange={(e) => update('font', e.target.value as FontFamily)}
                className="w-full appearance-none bg-[#070d1a] border border-white/10 text-zinc-300 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#070d1a] border border-white/5 rounded-lg px-3 py-2.5">
                <p className="text-xs font-semibold text-zinc-300 mb-1">
                  {selectedFont.label.split(' (')[0]} Regular
                </p>
                <p className="text-[11px] text-zinc-500">
                  The quick brown fox jumps over the lazy dog. 0123456789
                </p>
              </div>
              <div className="w-14 bg-[#070d1a] border border-white/5 rounded-lg flex flex-col items-center justify-center gap-0.5">
                <span className="text-base font-semibold text-zinc-300">Aa</span>
                <span className="text-[9px] tracking-widest uppercase text-zinc-600">Preview</span>
              </div>
            </div>
          </section>

          {/* Glass Transmission */}
          <section className="bg-[#0b1424] rounded-xl border border-white/5 p-5">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-4">
              Glass Transmission
            </h3>
            <label className="block text-[10px] tracking-wider uppercase text-zinc-500 mb-2">
              Window Opacity
            </label>
            <div className="flex items-end justify-between mb-6">
              <span className="text-3xl font-semibold text-zinc-200">{draft.windowOpacity}%</span>
              <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full h-1 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-zinc-600">60%</span>
              <span className="text-[10px] text-zinc-600">80%</span>
              <span className="text-[10px] text-zinc-600">100%</span>
            </div>
          </section>
        </div>

        {/* ── Structural Geometry + Overlay Preview ── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Structural Geometry */}
          <section>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-3">
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
                        ? 'border-blue-500/50 bg-blue-600/10'
                        : 'border-white/5 bg-[#0b1424] hover:border-white/10'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        active ? 'border-blue-500' : 'border-zinc-600'
                      }`}
                    >
                      {active && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${active ? 'text-zinc-200' : 'text-zinc-400'}`}>
                        {r.label}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {r.px} · {r.desc}
                      </p>
                    </div>
                    <div className="flex-shrink-0">{r.icon}</div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Overlay Engine Preview */}
          <section>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-3">
              Overlay Engine Preview
            </h3>
            <div className="bg-[#070d1a] rounded-xl border border-white/5 p-3 h-[calc(100%-28px)] flex flex-col">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-[200px] bg-zinc-900 rounded-xl border border-zinc-700 p-2 shadow-xl">
                  <div className="h-6 bg-zinc-800 rounded-lg mb-2 flex items-center px-2 gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                    <div className="flex-1 h-1 bg-zinc-700 rounded" />
                  </div>
                  <div className="flex items-center gap-1 mb-2 px-1">
                    <svg className="w-2.5 h-2.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <span className="text-[8px] font-bold tracking-widest uppercase text-zinc-400">
                      Picker Module
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mb-1">
                    {['bg-zinc-500', 'bg-rose-300', 'bg-orange-400', 'bg-zinc-400',
                      'bg-zinc-600', 'bg-zinc-700', 'bg-blue-500', 'bg-zinc-600'].map((c, i) => (
                      <div key={i} className={`h-5 rounded ${c} opacity-90`} />
                    ))}
                  </div>
                  <div className="h-1 bg-zinc-700 rounded-full mt-2">
                    <div className="h-full w-2/3 bg-blue-500 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] text-blue-400 italic">Live Simulation Enabled</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Render 4K</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dirty ? 'bg-amber-500' : 'bg-blue-500'}`} />
          <span className="text-[10px] tracking-widest uppercase text-zinc-500">
            {dirty ? 'Unsaved changes' : 'Config Synchronized'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={discard}
            className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors tracking-wide uppercase"
          >
            Discard
          </button>
          <button
            onClick={dirty ? save : undefined}
            className={`px-5 py-1.5 text-xs font-semibold rounded-lg tracking-wide uppercase transition-colors ${
              dirty
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                : 'bg-blue-600/30 text-blue-400/40 cursor-default'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
