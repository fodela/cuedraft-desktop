import { useState, useCallback } from 'react'

interface HotkeyInputProps {
  value: string
  onChange: (accelerator: string) => void
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta'])

function formatKeyEvent(e: React.KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null

  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')
  if (e.metaKey) parts.push('Super')

  // Need at least one modifier
  if (parts.length === 0) return null

  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key
  parts.push(key === ' ' ? 'Space' : key)

  return parts.join('+')
}

export function HotkeyInput({ value, onChange }: HotkeyInputProps) {
  const [recording, setRecording] = useState(false)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        setRecording(false)
        return
      }

      const accelerator = formatKeyEvent(e)
      if (accelerator) {
        onChange(accelerator)
        setRecording(false)
      }
    },
    [onChange]
  )

  return (
    <button
      onClick={() => setRecording(true)}
      onKeyDown={recording ? handleKeyDown : undefined}
      onBlur={() => setRecording(false)}
      className={`px-3 py-2 text-sm rounded border transition-colors ${
        recording
          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
          : 'border-zinc-600 bg-zinc-800 text-zinc-200 hover:border-zinc-500'
      }`}
    >
      {recording ? 'Press a key combination…' : value}
    </button>
  )
}
