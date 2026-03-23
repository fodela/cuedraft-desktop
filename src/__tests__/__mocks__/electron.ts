import { vi } from 'vitest'

export const app = {
  getPath: vi.fn((name: string) => `/tmp/cuedraft-test/${name}`),
  setLoginItemSettings: vi.fn(),
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
  readText: vi.fn(() => ''),
  writeText: vi.fn(),
}
