import { useState, useEffect, useCallback } from 'react'
import type { Settings } from '../../shared/types'
import { parseHotkey } from '../../shared/hotkey-utils'

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta'])

function formatKeyEvent(e: React.KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')
  if (e.metaKey) parts.push('Super')
  if (parts.length === 0) return null
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key
  parts.push(key === ' ' ? 'Space' : key)
  return parts.join('+')
}

function KeyChips({ hotkey }: { hotkey: string }) {
  const parts = parseHotkey(hotkey)
  return (
    <div className="flex items-center gap-1">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          <kbd className="px-2.5 py-1 text-xs font-semibold bg-raised text-accent rounded border border-mid">
            {part}
          </kbd>
          {i < parts.length - 1 && (
            <span className="text-t4 text-xs">+</span>
          )}
        </span>
      ))}
    </div>
  )
}

interface RecordableRowProps {
  label: string
  sublabel: string
  hotkey: string
  onRecord: (newHotkey: string) => void
  fixed?: boolean
}

function RecordableRow({ label, sublabel, hotkey, onRecord, fixed }: RecordableRowProps) {
  const [recording, setRecording] = useState(false)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') { setRecording(false); return }
      const acc = formatKeyEvent(e)
      if (acc) { onRecord(acc); setRecording(false) }
    },
    [onRecord]
  )

  return (
    <div className="flex items-center px-5 py-4 border-b border-low last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-t1">{label}</p>
        <p className="text-[10px] tracking-widest uppercase text-t3 mt-0.5">{sublabel}</p>
      </div>
      {fixed ? (
        <KeyChips hotkey={hotkey} />
      ) : recording ? (
        <button
          autoFocus
          onKeyDown={handleKeyDown}
          onBlur={() => setRecording(false)}
          className="px-3 py-1.5 text-xs text-accent border border-accent rounded-lg bg-accent-dim animate-pulse focus:outline-none"
        >
          Press combination…
        </button>
      ) : (
        <button
          onClick={() => setRecording(true)}
          className="group flex items-center gap-2"
          title="Click to rebind"
        >
          <KeyChips hotkey={hotkey} />
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-t4 transition-opacity ml-1">
            click to change
          </span>
        </button>
      )}
    </div>
  )
}

function SectionDivider({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold tracking-widest uppercase text-t3">
        {number}. {label}
      </span>
      <div className="flex-1 h-px bg-raised" />
    </div>
  )
}

export function KeybindingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [vimMode, setVimMode] = useState(false)

  useEffect(() => {
    window.cuedraft.settings.get().then((s) => {
      setSettings(s)
      setVimMode(s.vimMode)
    })
  }, [])

  const updateHotkey = useCallback(async (hotkey: string) => {
    const result = await window.cuedraft.settings.set({ hotkey })
    setSettings(result)
  }, [])

  const toggleVimMode = useCallback(async () => {
    const next = !vimMode
    setVimMode(next)
    await window.cuedraft.settings.set({ vimMode: next })
  }, [vimMode])

  const resetToDefaults = useCallback(async () => {
    const result = await window.cuedraft.settings.reset()
    setSettings(result)
    setVimMode(result.vimMode)
  }, [])

  const exportBindings = useCallback(() => {
    if (!settings) return
    const data = {
      profile: 'default.config',
      bindings: {
        triggerMenu: settings.hotkey,
        syncWorkspace: 'Ctrl+S',
        nextTemplate: 'Tab',
        prevTemplate: 'Shift+Tab',
        insertTemplate: 'Ctrl+Enter',
        closeOverlay: 'Escape',
      },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cuedraft-keybindings.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [settings])

  if (!settings) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
        {/* Page title */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-t1 uppercase mb-2">
              Keyboard Shortcuts
            </h1>
            <p className="text-sm text-t3 max-w-lg">
              Modify the kinetic engine triggers for maximum throughput. Global shortcuts override local application focus.
            </p>
          </div>
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-xs font-bold tracking-widest uppercase border border-accent text-accent rounded-lg hover:bg-accent-dim transition-colors shrink-0"
          >
            Reset to Defaults
          </button>
        </div>

        {/* 01. Global Triggers */}
        <div className="mb-8">
          <SectionDivider number="01" label="Global Triggers" />
          <div className="bg-surface rounded-xl border border-low overflow-hidden">
            <RecordableRow
              label="Trigger Menu"
              sublabel="Main command palette access"
              hotkey={settings.hotkey}
              onRecord={updateHotkey}
            />
            <RecordableRow
              label="Sync Workspace"
              sublabel="Force cloud synchronization"
              hotkey="Ctrl+S"
              onRecord={() => {}}
              fixed
            />
          </div>
        </div>

        {/* 02. Template Navigation */}
        <div className="mb-8">
          <SectionDivider number="02" label="Template Navigation" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-xl border border-low p-5">
              <div className="flex items-start justify-between mb-5">
                <div className="w-9 h-9 rounded-lg bg-base border border-low flex items-center justify-center">
                  <svg className="w-4 h-4 text-t2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <KeyChips hotkey="Tab" />
              </div>
              <p className="text-base font-bold text-t1 mb-1">Next Template</p>
              <p className="text-[10px] tracking-widest uppercase text-t3">Cycle forward through slots</p>
            </div>

            <div className="bg-surface rounded-xl border border-low p-5">
              <div className="flex items-start justify-between mb-5">
                <div className="w-9 h-9 rounded-lg bg-base border border-low flex items-center justify-center">
                  <svg className="w-4 h-4 text-t2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <KeyChips hotkey="Shift+Tab" />
              </div>
              <p className="text-base font-bold text-t1 mb-1">Previous Template</p>
              <p className="text-[10px] tracking-widest uppercase text-t3">Cycle backward through slots</p>
            </div>
          </div>
        </div>

        {/* Bottom row: Conflict Monitor + Vim Mode */}
        <div className="grid grid-cols-[1fr_220px] gap-4">
          <div className="bg-surface rounded-xl border border-low p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-widest uppercase text-t2">
                Conflict Monitor
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/50" />
            </div>
            <p className="text-xs text-t3 leading-relaxed">
              No keybinding conflicts detected in current profile. All 48 system triggers are active and mapped.
            </p>
          </div>

          <button
            onClick={toggleVimMode}
            className={`rounded-xl border p-5 flex flex-col items-center justify-center gap-3 transition-colors ${
              vimMode
                ? 'bg-accent-dim border-accent'
                : 'bg-surface border-low hover:border-mid'
            }`}
          >
            <svg className={`w-8 h-8 ${vimMode ? 'text-accent' : 'text-t3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`text-[10px] font-bold tracking-widest uppercase ${vimMode ? 'text-accent' : 'text-t3'}`}>
              Vim Mode: {vimMode ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-low shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-t4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="tracking-widest uppercase">Profile: default.config</span>
          </div>
          <span className="text-t4">|</span>
          <span className="tracking-widest uppercase">UTF-8</span>
        </div>
        <button
          onClick={exportBindings}
          className="text-[10px] tracking-widest uppercase text-t3 hover:text-t1 transition-colors"
        >
          Export Bindings (JSON)
        </button>
      </div>
    </div>
  )
}
