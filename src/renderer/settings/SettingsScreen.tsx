import { useState, useEffect, useCallback } from 'react'
import type { Settings } from '../../shared/types'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-accent' : 'bg-t4'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-t3 shrink-0" />
      <span className="text-[10px] font-bold tracking-widest uppercase text-t3">{label}</span>
    </div>
  )
}

export function SettingsScreen() {
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

  const discard = useCallback(() => setDraft(saved), [saved])

  const restoreDefaults = useCallback(async () => {
    const result = await window.cuedraft.settings.reset()
    setSaved(result)
    setDraft(result)
  }, [])

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 min-h-0">

        {/* ── Startup & System Behavior ── */}
        <section>
          <SectionLabel label="Startup & System Behavior" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-low rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center shrink-0">
                  <svg className="w-[18px] h-[18px] text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                </div>
                <Toggle checked={draft.launchAtStartup} onChange={(v) => update('launchAtStartup', v)} />
              </div>
              <h4 className="text-sm font-semibold text-t1 mb-1">Launch at startup</h4>
              <p className="text-xs text-t3 leading-relaxed">
                Automatically initialize CueDraft background engine when the workstation boots.
              </p>
            </div>

            <div className="bg-surface border border-low rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center shrink-0">
                  <svg className="w-[18px] h-[18px] text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <Toggle checked={draft.showInTray} onChange={(v) => update('showInTray', v)} />
              </div>
              <h4 className="text-sm font-semibold text-t1 mb-1">Show in system tray</h4>
              <p className="text-xs text-t3 leading-relaxed">
                Keep the application active in the taskbar notification area when the main window is closed.
              </p>
            </div>
          </div>
        </section>

        {/* ── Workflow Engine ── */}
        <section>
          <SectionLabel label="Workflow Engine" />
          <div className="space-y-3">
            <div className="bg-surface border border-low rounded-xl p-5 flex items-center gap-6">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-t1 mb-1">Default injection method</h4>
                <p className="text-xs text-t3 leading-relaxed max-w-md">
                  Choose how templates are inserted into target applications. 'Type' simulates keystrokes for high compatibility.
                </p>
              </div>
              <div className="flex items-center bg-base border border-mid rounded-lg p-0.5 shrink-0">
                {(['auto', 'clipboard'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => update('injectionMethod', method)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase transition-colors ${
                      draft.injectionMethod === method
                        ? 'bg-accent text-white shadow'
                        : 'text-t3 hover:text-t2'
                    }`}
                  >
                    {method === 'auto' ? 'Type' : 'Clipboard'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-low rounded-xl p-5 flex items-center gap-5">
              <div className="w-10 h-10 rounded-lg bg-raised border border-low flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-t2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-t1">Privacy Mode</h4>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-raised text-t2 rounded border border-mid">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-t3 leading-relaxed">
                  Obfuscates template content in the picker preview. Essential for preventing shoulder-surfing of sensitive draft data or keys.
                </p>
              </div>
              <Toggle checked={draft.privacyMode} onChange={(v) => update('privacyMode', v)} />
            </div>
          </div>
        </section>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Database Size', value: '12.4 MB' },
            { label: 'Last Sync',     value: '2m ago' },
            { label: 'Memory Hook',   value: 'Stable' },
          ].map((card) => (
            <div key={card.label} className="bg-surface border border-low rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-base flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-accent" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-t3 mb-0.5">{card.label}</div>
                <div className="text-sm font-semibold text-t1">{card.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-low shrink-0">
        <div className="flex items-center gap-3 text-[10px] text-t4">
          <span>
            <kbd className="px-1.5 py-0.5 bg-raised text-t3 rounded border border-mid font-mono">ESC</kbd>
            <span className="ml-1.5">to discard</span>
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-raised text-t3 rounded border border-mid font-mono">F5</kbd>
            <span className="ml-1.5">to force save</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={restoreDefaults}
            className="px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-t2 hover:text-t1 transition-colors"
          >
            Restore Defaults
          </button>
          <button
            onClick={dirty ? save : undefined}
            className={`px-5 py-1.5 text-xs font-bold tracking-widest uppercase rounded-lg transition-colors ${
              dirty
                ? 'bg-accent hover:opacity-90 text-white cursor-pointer'
                : 'bg-accent-dim text-t3 cursor-default'
            }`}
          >
            Save Config
          </button>
        </div>
      </div>
    </div>
  )
}
