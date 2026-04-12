import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IPC } from '../../../shared/types'

vi.mock('../../../main/db/repository', () => ({
  getAll: vi.fn(() => []),
  list: vi.fn(() => ({ items: [], total: 0 })),
  search: vi.fn(() => []),
  getCategories: vi.fn(() => []),
  getByCategory: vi.fn(() => []),
  getById: vi.fn(() => undefined),
  create: vi.fn((d: unknown) => ({ id: 1, ...d })),
  update: vi.fn((d: unknown) => d),
  remove: vi.fn(),
  removeMany: vi.fn(),
  recordUsage: vi.fn(),
}))
vi.mock('../../../main/windows', () => ({ hidePicker: vi.fn() }))
vi.mock('../../../main/injection', () => ({ injectText: vi.fn(() => Promise.resolve()) }))
vi.mock('../../../main/db/settings-store', () => ({
  getSettings: vi.fn(() => ({
    hotkey: 'Ctrl+Shift+Space',
    injectionMethod: 'auto',
    launchAtStartup: false,
    showInTray: true,
    privacyMode: true,
    vimMode: false,
    theme: 'dark',
    accentColor: 'teal',
    windowOpacity: 92,
    borderRadius: 'subtle',
    font: 'inter',
  })),
}))

describe('registerTemplateHandlers', () => {
  // Collect registered handlers
  const handlers = new Map<string, Function>()

  beforeEach(async () => {
    handlers.clear()
    vi.clearAllMocks()

    // Re-import ipcMain after clearing mocks so handle.mock.calls is fresh
    const electron = await import('electron')
    vi.mocked(electron.ipcMain.handle).mockImplementation((channel: string, fn: Function) => {
      handlers.set(channel, fn)
      return electron.ipcMain
    })

    const { registerTemplateHandlers } = await import('../../../main/ipc/templates')
    registerTemplateHandlers()
  })

  it('registers handlers for all template IPC channels', () => {
    expect(handlers.has(IPC.TEMPLATES_GET_ALL)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_LIST)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_SEARCH)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_GET_CATEGORIES)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_GET_BY_CATEGORY)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_GET_BY_ID)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_CREATE)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_UPDATE)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_DELETE)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_BULK_DELETE)).toBe(true)
    expect(handlers.has(IPC.TEMPLATES_INJECT)).toBe(true)
  })

  it('TEMPLATES_GET_ALL handler calls repo.getAll()', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_GET_ALL)!(null)
    expect(repo.getAll).toHaveBeenCalled()
  })

  it('TEMPLATES_LIST handler calls repo.list(query)', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_LIST)!(null, { search: 'pain', limit: 25, offset: 50 })
    expect(repo.list).toHaveBeenCalledWith({
      search: 'pain',
      category: null,
      limit: 25,
      offset: 50,
    })
  })

  it('TEMPLATES_SEARCH handler calls repo.search(q)', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_SEARCH)!(null, { q: 'pain' })
    expect(repo.search).toHaveBeenCalledWith('pain')
  })

  it('TEMPLATES_GET_CATEGORIES handler calls repo.getCategories()', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_GET_CATEGORIES)!(null)
    expect(repo.getCategories).toHaveBeenCalled()
  })

  it('TEMPLATES_GET_BY_CATEGORY handler calls repo.getByCategory(category)', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_GET_BY_CATEGORY)!(null, { category: 'Medical' })
    expect(repo.getByCategory).toHaveBeenCalledWith('Medical')
  })

  it('TEMPLATES_GET_BY_ID handler calls repo.getById(id)', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_GET_BY_ID)!(null, { id: 5 })
    expect(repo.getById).toHaveBeenCalledWith(5)
  })

  it('TEMPLATES_CREATE handler calls repo.create(data)', async () => {
    const repo = await import('../../../main/db/repository')
    const data = { title: 'New', content: 'Content', category: 'Cat', use_count: 0, last_used: null }
    await handlers.get(IPC.TEMPLATES_CREATE)!(null, data)
    expect(repo.create).toHaveBeenCalledWith(data)
  })

  it('TEMPLATES_UPDATE handler calls repo.update(data)', async () => {
    const repo = await import('../../../main/db/repository')
    const data = { id: 1, title: 'T', content: 'C', category: null, use_count: 1, last_used: null }
    await handlers.get(IPC.TEMPLATES_UPDATE)!(null, data)
    expect(repo.update).toHaveBeenCalledWith(data)
  })

  it('TEMPLATES_DELETE handler calls repo.remove(id)', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_DELETE)!(null, { id: 3 })
    expect(repo.remove).toHaveBeenCalledWith(3)
  })

  it('TEMPLATES_BULK_DELETE handler calls repo.removeMany(ids)', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_BULK_DELETE)!(null, { ids: [3, 5, 5] })
    expect(repo.removeMany).toHaveBeenCalledWith([3, 5])
  })

  it('TEMPLATES_INJECT calls hidePicker then injectText', async () => {
    const { hidePicker } = await import('../../../main/windows')
    const { injectText } = await import('../../../main/injection')
    await handlers.get(IPC.TEMPLATES_INJECT)!(null, { content: 'Hello', id: 1 })
    expect(hidePicker).toHaveBeenCalled()
    expect(injectText).toHaveBeenCalledWith('Hello', 'auto')
  })

  it('TEMPLATES_INJECT calls recordUsage when id is provided', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_INJECT)!(null, { content: 'Hello', id: 7 })
    expect(repo.recordUsage).toHaveBeenCalledWith(7)
  })

  it('TEMPLATES_INJECT does not call recordUsage when id is undefined', async () => {
    const repo = await import('../../../main/db/repository')
    await handlers.get(IPC.TEMPLATES_INJECT)!(null, { content: 'Hello' })
    expect(repo.recordUsage).not.toHaveBeenCalled()
  })
})
