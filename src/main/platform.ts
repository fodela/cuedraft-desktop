import { execFileSync } from 'child_process'

export type Platform = 'win32' | 'linux-x11' | 'linux-wayland'

export function getPlatform(): Platform {
  if (process.platform === 'win32') return 'win32'
  if (isWayland()) return 'linux-wayland'
  return 'linux-x11'
}

export function isWayland(): boolean {
  return (
    !!process.env.WAYLAND_DISPLAY &&
    process.env.ELECTRON_OZONE_PLATFORM_HINT !== 'x11'
  )
}

export function hasCommand(cmd: string): boolean {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function hasXdotool(): boolean {
  return hasCommand('xdotool')
}

export function hasWlCopy(): boolean {
  return hasCommand('wl-copy')
}
