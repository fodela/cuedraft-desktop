import { clipboard } from 'electron'
import { execSync } from 'child_process'
import * as robot from '@jitsi/robotjs'
import { getPlatform, hasXdotool, hasWlCopy } from './platform'

const MAX_CONTENT_LENGTH = 10_000
const TYPE_THRESHOLD = 100

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
    execSync('xdotool type --clearmodifiers --delay 10 -- ' + JSON.stringify(text), {
      timeout: 5000,
    })
    return true
  } catch {
    return false
  }
}

function pasteViaClipboard(text: string): void {
  clipboard.writeText(text)
  try {
    robot.keyToggle('shift', 'up')
    robot.keyToggle('control', 'up')
    robot.setKeyboardDelay(50)
    robot.keyTap('v', 'control')
  } catch {
    console.warn('[inject] robotjs Ctrl+V failed, text is on clipboard')
  }
}

function pasteViaWlCopy(text: string): void {
  if (hasWlCopy()) {
    try {
      execSync('wl-copy -- ' + JSON.stringify(text), { timeout: 3000 })
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
  } catch {
    console.warn('[inject] Wayland paste: text copied, Ctrl+V failed')
  }
}

export async function injectText(text: string): Promise<void> {
  const clean = sanitize(text)
  const platform = getPlatform()

  // Wait for focus to return to target app
  await new Promise((resolve) => setTimeout(resolve, 80))

  // For long text, always use clipboard paste
  if (clean.length > TYPE_THRESHOLD) {
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
