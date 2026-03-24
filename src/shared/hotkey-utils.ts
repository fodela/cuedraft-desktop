/** Parse "Ctrl+Shift+Space" → ["Ctrl", "Shift", "Space"] */
export function parseHotkey(hotkey: string): string[] {
  return hotkey.split('+').filter(Boolean)
}
