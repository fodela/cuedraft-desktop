import { describe, it, expect } from 'vitest'
import { parseHotkey } from '../../shared/hotkey-utils'

describe('parseHotkey', () => {
  it('splits "Ctrl+Shift+Space" into three parts', () => {
    expect(parseHotkey('Ctrl+Shift+Space')).toEqual(['Ctrl', 'Shift', 'Space'])
  })

  it('returns single-element array for a key with no +', () => {
    expect(parseHotkey('Space')).toEqual(['Space'])
  })

  it('splits "Alt+F4" into two parts', () => {
    expect(parseHotkey('Alt+F4')).toEqual(['Alt', 'F4'])
  })

  it('returns empty array for empty string', () => {
    expect(parseHotkey('')).toEqual([])
  })

  it('handles two-part shortcut "Ctrl+S"', () => {
    expect(parseHotkey('Ctrl+S')).toEqual(['Ctrl', 'S'])
  })
})
