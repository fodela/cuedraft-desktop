import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'

// Stub window.cuedraft for renderer (happy-dom) tests
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).cuedraft = {
    templates: {
      getAll: vi.fn(() => Promise.resolve([])),
      list: vi.fn(() => Promise.resolve({ items: [], total: 0 })),
      search: vi.fn(() => Promise.resolve([])),
      getCategories: vi.fn(() => Promise.resolve([])),
      getByCategory: vi.fn(() => Promise.resolve([])),
      getById: vi.fn(() => Promise.resolve(undefined)),
      create: vi.fn(() => Promise.resolve({})),
      update: vi.fn(() => Promise.resolve({})),
      delete: vi.fn(() => Promise.resolve()),
      bulkDelete: vi.fn(() => Promise.resolve()),
      inject: vi.fn(() => Promise.resolve()),
    },
    notes: {
      getAll: vi.fn(() => Promise.resolve([])),
      list: vi.fn(() => Promise.resolve({ items: [], total: 0 })),
      getById: vi.fn(() => Promise.resolve(undefined)),
      create: vi.fn(() => Promise.resolve({})),
      update: vi.fn(() => Promise.resolve({})),
      delete: vi.fn(() => Promise.resolve()),
      bulkDelete: vi.fn(() => Promise.resolve()),
    },
    settings: {
      get: vi.fn(() => Promise.resolve({
        hotkey: 'Ctrl+Shift+Space',
        injectionMethod: 'auto',
        launchAtStartup: false,
        showInTray: true,
        privacyMode: true,
        vimMode: false,
        theme: 'dark',
        accentColor: 'teal',
        windowOpacity: 100,
        borderRadius: 'subtle',
        font: 'inter',
      })),
      set: vi.fn((p: unknown) => Promise.resolve(p)),
      reset: vi.fn(() => Promise.resolve({
        hotkey: 'Ctrl+Shift+Space',
        injectionMethod: 'auto',
        launchAtStartup: false,
        showInTray: true,
        privacyMode: true,
        vimMode: false,
        theme: 'dark',
        accentColor: 'teal',
        windowOpacity: 100,
        borderRadius: 'subtle',
        font: 'inter',
      })),
    },
    picker: {
      onShow: vi.fn(() => () => {}),
      onHide: vi.fn(() => () => {}),
    },
  }
}

afterEach(() => {
  vi.clearAllMocks()
})
