import { clipboard } from 'electron'
import { execFileSync } from 'child_process'
import * as robot from '@jitsi/robotjs'
import { getPlatform, hasXdotool, hasWlCopy } from './platform'
import type { Settings } from '../shared/types'

const MAX_CONTENT_LENGTH = 10_000
const TYPE_THRESHOLD = 100
const CLIPBOARD_RESTORE_DELAY_MS = 1500
const CLIPBOARD_RESTORE_FALLBACK_DELAY_MS = 30_000

type ClipboardSnapshot = Array<{ format: string; data: Uint8Array }>

function sanitize(text: string): string {
  let clean = text.replace(/\0/g, '')
  if (clean.length > MAX_CONTENT_LENGTH) {
    clean = clean.slice(0, MAX_CONTENT_LENGTH)
  }
  return clean
}

function typeViaRobotjs(text: string): boolean {
  try {
    robot.keyToggle('shift', 'up')
    robot.keyToggle('control', 'up')
    robot.setKeyboardDelay(10)
    robot.typeString(text)
    return true
  } catch {
    return false
  }
}

function typeViaXdotool(text: string): boolean {
  if (!hasXdotool()) return false
  try {
    execFileSync('xdotool', ['type', '--clearmodifiers', '--delay', '10', '--', text], {
      timeout: 5000,
    })
    return true
  } catch {
    return false
  }
}

function snapshotClipboard(): ClipboardSnapshot | null {
  if (typeof clipboard.availableFormats !== 'function') return null

  const formats = clipboard.availableFormats()
  if (formats.length === 0) return []

  return formats.map((format) => ({
    format,
    data: clipboard.readBuffer(format),
  }))
}

function restoreClipboard(snapshot: ClipboardSnapshot | null): void {
  if (!snapshot || typeof clipboard.clear !== 'function' || typeof clipboard.writeBuffer !== 'function') {
    return
  }

  clipboard.clear()
  for (const { format, data } of snapshot) {
    clipboard.writeBuffer(format, Buffer.from(data))
  }
}

function scheduleClipboardRestore(snapshot: ClipboardSnapshot | null, delayMs: number): void {
  if (snapshot === null) return
  setTimeout(() => {
    try {
      restoreClipboard(snapshot)
    } catch (error) {
      console.warn('[inject] failed to restore clipboard', error)
    }
  }, delayMs)
}

function pasteViaClipboard(text: string): void {
  const snapshot = snapshotClipboard()
  clipboard.writeText(text)
  try {
    robot.keyToggle('shift', 'up')
    robot.keyToggle('control', 'up')
    robot.setKeyboardDelay(50)
    robot.keyTap('v', 'control')
    scheduleClipboardRestore(snapshot, CLIPBOARD_RESTORE_DELAY_MS)
  } catch {
    console.warn('[inject] robotjs Ctrl+V failed, text is on clipboard')
    scheduleClipboardRestore(snapshot, CLIPBOARD_RESTORE_FALLBACK_DELAY_MS)
  }
}

function pasteViaWlCopy(text: string): void {
  const snapshot = snapshotClipboard()
  if (hasWlCopy()) {
    try {
      execFileSync('wl-copy', ['--'], { input: text, timeout: 3000 })
    } catch {
      clipboard.writeText(text)
    }
  } else {
    clipboard.writeText(text)
  }

  try {
    robot.keyToggle('shift', 'up')
    robot.keyToggle('control', 'up')
    robot.setKeyboardDelay(50)
    robot.keyTap('v', 'control')
    scheduleClipboardRestore(snapshot, CLIPBOARD_RESTORE_DELAY_MS)
  } catch {
    console.warn('[inject] Wayland paste: text copied, Ctrl+V failed')
    scheduleClipboardRestore(snapshot, CLIPBOARD_RESTORE_FALLBACK_DELAY_MS)
  }
}

export async function injectText(
  text: string,
  injectionMethod: Settings['injectionMethod'] = 'auto'
): Promise<void> {
  const clean = sanitize(text)
  const platform = getPlatform()

  // Wait for focus to return to target app
  await new Promise((resolve) => setTimeout(resolve, 80))

  // For long text, always use clipboard paste
  if (injectionMethod === 'clipboard' || clean.length > TYPE_THRESHOLD) {
    if (platform === 'linux-wayland') {
      pasteViaWlCopy(clean)
    } else {
      pasteViaClipboard(clean)
    }
    return
  }

  switch (platform) {
    case 'win32':
      if (!typeViaRobotjs(clean)) {
        pasteViaClipboard(clean)
      }
      break

    case 'linux-x11':
      if (!typeViaRobotjs(clean)) {
        if (!typeViaXdotool(clean)) {
          pasteViaClipboard(clean)
        }
      }
      break

    case 'linux-wayland':
      pasteViaWlCopy(clean)
      break
  }
}
