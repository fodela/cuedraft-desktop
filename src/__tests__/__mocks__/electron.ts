import { vi } from 'vitest'

export const app = {
  getPath: vi.fn((name: string) => `/tmp/cuedraft-test/${name}`),
  setLoginItemSettings: vi.fn(),
  exit: vi.fn(),
}

export const globalShortcut = {
  register: vi.fn(() => true),
  unregister: vi.fn(),
  unregisterAll: vi.fn(),
}

export const ipcMain = {
  handle: vi.fn(),
  on: vi.fn(),
  removeHandler: vi.fn(),
}

export const clipboard = {
  availableFormats: vi.fn(() => []),
  readBuffer: vi.fn(() => Buffer.from('')),
  readText: vi.fn(() => ''),
  clear: vi.fn(),
  writeBuffer: vi.fn(),
  writeText: vi.fn(),
}

export const Menu = {
  buildFromTemplate: vi.fn((template: unknown) => template),
}

export const nativeImage = {
  createFromPath: vi.fn(() => ({
    resize: vi.fn(() => ({})),
  })),
}

export class Tray {
  setToolTip = vi.fn()
  setContextMenu = vi.fn()
  on = vi.fn()
  destroy = vi.fn()
}
