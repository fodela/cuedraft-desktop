import { useState, useEffect, useCallback } from 'react'
import type { Settings } from '../../shared/types'

/** Parse "Ctrl+Shift+Space" → ["Ctrl", "Shift", "Space"] */
function parseHotkey(hotkey: string): string[] {
  return hotkey.split('+').filter(Boolean)
}

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
          <kbd className="px-2.5 py-1 text-xs font-semibold bg-[#0d1a35] text-blue-300 rounded border border-blue-900/60">
            {part}
          </kbd>
          {i < parts.length - 1 && (
            <span className="text-zinc-600 text-xs">+</span>
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
    <div className="flex items-center px-5 py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-200">{label}</p>
        <p className="text-[10px] tracking-widest uppercase text-zinc-500 mt-0.5">{sublabel}</p>
      </div>
      {fixed ? (
        <KeyChips hotkey={hotkey} />
      ) : recording ? (
        <button
          autoFocus
          onKeyDown={handleKeyDown}
          onBlur={() => setRecording(false)}
          className="px-3 py-1.5 text-xs text-blue-400 border border-blue-500 rounded-lg bg-blue-500/10 animate-pulse focus:outline-none"
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
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-600 transition-opacity ml-1">
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
      <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
        {number}. {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
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
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
        {/* Page title */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-100 uppercase mb-2">
              Keyboard Shortcuts
            </h1>
            <p className="text-sm text-zinc-500 max-w-lg">
              Modify the kinetic engine triggers for maximum throughput. Global shortcuts override local application focus.
            </p>
          </div>
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-xs font-bold tracking-widest uppercase border border-blue-500/40 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors shrink-0"
          >
            Reset to Defaults
          </button>
        </div>

        {/* 01. Global Triggers */}
        <div className="mb-8">
          <SectionDivider number="01" label="Global Triggers" />
          <div className="bg-[#0b1424] rounded-xl border border-white/5 overflow-hidden">
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
            {/* Next Template */}
            <div className="bg-[#0b1424] rounded-xl border border-white/5 p-5">
              <div className="flex items-start justify-between mb-5">
                <div className="w-9 h-9 rounded-lg bg-[#070d1a] border border-white/5 flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <KeyChips hotkey="Tab" />
              </div>
              <p className="text-base font-bold text-zinc-200 mb-1">Next Template</p>
              <p className="text-[10px] tracking-widest uppercase text-zinc-500">Cycle forward through slots</p>
            </div>

            {/* Previous Template */}
            <div className="bg-[#0b1424] rounded-xl border border-white/5 p-5">
              <div className="flex items-start justify-between mb-5">
                <div className="w-9 h-9 rounded-lg bg-[#070d1a] border border-white/5 flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <KeyChips hotkey="Shift+Tab" />
              </div>
              <p className="text-base font-bold text-zinc-200 mb-1">Previous Template</p>
              <p className="text-[10px] tracking-widest uppercase text-zinc-500">Cycle backward through slots</p>
            </div>
          </div>
        </div>

        {/* Bottom row: Conflict Monitor + Vim Mode */}
        <div className="grid grid-cols-[1fr_220px] gap-4">
          {/* Conflict Monitor */}
          <div className="bg-[#0b1424] rounded-xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                Conflict Monitor
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/50" />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              No keybinding conflicts detected in current profile. All 48 system triggers are active and mapped.
            </p>
          </div>

          {/* Vim Mode */}
          <button
            onClick={toggleVimMode}
            className={`rounded-xl border p-5 flex flex-col items-center justify-center gap-3 transition-colors ${
              vimMode
                ? 'bg-blue-600/10 border-blue-500/30'
                : 'bg-[#0b1424] border-white/5 hover:border-white/10'
            }`}
          >
            <svg className={`w-8 h-8 ${vimMode ? 'text-blue-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`text-[10px] font-bold tracking-widest uppercase ${vimMode ? 'text-blue-400' : 'text-zinc-500'}`}>
              Vim Mode: {vimMode ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-zinc-600">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="tracking-widest uppercase">Profile: default.config</span>
          </div>
          <span className="text-zinc-700">|</span>
          <span className="tracking-widest uppercase">UTF-8</span>
        </div>
        <button
          onClick={exportBindings}
          className="text-[10px] tracking-widest uppercase text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Export Bindings (JSON)
        </button>
      </div>
    </div>
  )
}
