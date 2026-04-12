import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IPC } from '../../../shared/types'

vi.mock('../../../main/db/notes-repository', () => ({
  getAll: vi.fn(() => []),
  list: vi.fn(() => ({ items: [], total: 0 })),
  getById: vi.fn(() => undefined),
  create: vi.fn((d: unknown) => ({ id: 1, ...d })),
  update: vi.fn((d: unknown) => d),
  remove: vi.fn(),
  removeMany: vi.fn(),
}))

describe('registerNoteHandlers', () => {
  const handlers = new Map<string, Function>()

  beforeEach(async () => {
    handlers.clear()
    vi.clearAllMocks()

    const electron = await import('electron')
    vi.mocked(electron.ipcMain.handle).mockImplementation((channel: string, fn: Function) => {
      handlers.set(channel, fn)
      return electron.ipcMain
    })

    const { registerNoteHandlers } = await import('../../../main/ipc/notes')
    registerNoteHandlers()
  })

  it('registers handlers for all note IPC channels', () => {
    expect(handlers.has(IPC.NOTES_GET_ALL)).toBe(true)
    expect(handlers.has(IPC.NOTES_LIST)).toBe(true)
    expect(handlers.has(IPC.NOTES_GET_BY_ID)).toBe(true)
    expect(handlers.has(IPC.NOTES_CREATE)).toBe(true)
    expect(handlers.has(IPC.NOTES_UPDATE)).toBe(true)
    expect(handlers.has(IPC.NOTES_DELETE)).toBe(true)
    expect(handlers.has(IPC.NOTES_BULK_DELETE)).toBe(true)
  })

  it('NOTES_GET_ALL handler calls repo.getAll()', async () => {
    const repo = await import('../../../main/db/notes-repository')
    await handlers.get(IPC.NOTES_GET_ALL)!(null)
    expect(repo.getAll).toHaveBeenCalled()
  })

  it('NOTES_LIST handler calls repo.list(query)', async () => {
    const repo = await import('../../../main/db/notes-repository')
    await handlers.get(IPC.NOTES_LIST)!(null, { search: 'follow', limit: 25, offset: 0 })
    expect(repo.list).toHaveBeenCalledWith({
      search: 'follow',
      category: null,
      limit: 25,
      offset: 0,
    })
  })

  it('NOTES_GET_BY_ID handler calls repo.getById(id)', async () => {
    const repo = await import('../../../main/db/notes-repository')
    await handlers.get(IPC.NOTES_GET_BY_ID)!(null, { id: 2 })
    expect(repo.getById).toHaveBeenCalledWith(2)
  })

  it('NOTES_CREATE handler calls repo.create(data)', async () => {
    const repo = await import('../../../main/db/notes-repository')
    const data = { title: 'New', content: 'Content', category: 'Cat', created_at: 123 }
    await handlers.get(IPC.NOTES_CREATE)!(null, data)
    expect(repo.create).toHaveBeenCalledWith(data)
  })

  it('NOTES_UPDATE handler calls repo.update(data)', async () => {
    const repo = await import('../../../main/db/notes-repository')
    const data = { id: 1, title: 'T', content: 'C', category: null, created_at: 123 }
    await handlers.get(IPC.NOTES_UPDATE)!(null, data)
    expect(repo.update).toHaveBeenCalledWith(data)
  })

  it('NOTES_DELETE handler calls repo.remove(id)', async () => {
    const repo = await import('../../../main/db/notes-repository')
    await handlers.get(IPC.NOTES_DELETE)!(null, { id: 7 })
    expect(repo.remove).toHaveBeenCalledWith(7)
  })

  it('NOTES_BULK_DELETE handler calls repo.removeMany(ids)', async () => {
    const repo = await import('../../../main/db/notes-repository')
    await handlers.get(IPC.NOTES_BULK_DELETE)!(null, { ids: [7, 9, 9] })
    expect(repo.removeMany).toHaveBeenCalledWith([7, 9])
  })
})
