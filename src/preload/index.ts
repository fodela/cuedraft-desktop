import { contextBridge, ipcRenderer } from 'electron'
import type { Template, Note, Settings, ListQuery, ListResult } from '../shared/types'
import { IPC } from '../shared/types'

type Unsubscribe = () => void

const api = {
  templates: {
    getAll: (): Promise<Template[]> =>
      ipcRenderer.invoke(IPC.TEMPLATES_GET_ALL),
    list: (query?: ListQuery): Promise<ListResult<Template>> =>
      ipcRenderer.invoke(IPC.TEMPLATES_LIST, query),
    search: (q: string): Promise<Template[]> =>
      ipcRenderer.invoke(IPC.TEMPLATES_SEARCH, { q }),
    getCategories: (): Promise<string[]> =>
      ipcRenderer.invoke(IPC.TEMPLATES_GET_CATEGORIES),
    getByCategory: (category: string): Promise<Template[]> =>
      ipcRenderer.invoke(IPC.TEMPLATES_GET_BY_CATEGORY, { category }),
    getById: (id: number): Promise<Template | undefined> =>
      ipcRenderer.invoke(IPC.TEMPLATES_GET_BY_ID, { id }),
    create: (data: Omit<Template, 'id'>): Promise<Template> =>
      ipcRenderer.invoke(IPC.TEMPLATES_CREATE, data),
    update: (data: Template): Promise<Template> =>
      ipcRenderer.invoke(IPC.TEMPLATES_UPDATE, data),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC.TEMPLATES_DELETE, { id }),
    bulkDelete: (ids: number[]): Promise<void> =>
      ipcRenderer.invoke(IPC.TEMPLATES_BULK_DELETE, { ids }),
    inject: (content: string, id?: number): Promise<void> =>
      ipcRenderer.invoke(IPC.TEMPLATES_INJECT, { content, id }),
  },
  notes: {
    getAll: (): Promise<Note[]> =>
      ipcRenderer.invoke(IPC.NOTES_GET_ALL),
    list: (query?: ListQuery): Promise<ListResult<Note>> =>
      ipcRenderer.invoke(IPC.NOTES_LIST, query),
    getById: (id: number): Promise<Note | undefined> =>
      ipcRenderer.invoke(IPC.NOTES_GET_BY_ID, { id }),
    create: (data: Omit<Note, 'id'>): Promise<Note> =>
      ipcRenderer.invoke(IPC.NOTES_CREATE, data),
    update: (data: Note): Promise<Note> =>
      ipcRenderer.invoke(IPC.NOTES_UPDATE, data),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC.NOTES_DELETE, { id }),
    bulkDelete: (ids: number[]): Promise<void> =>
      ipcRenderer.invoke(IPC.NOTES_BULK_DELETE, { ids }),
  },
  settings: {
    get: (): Promise<Settings> =>
      ipcRenderer.invoke(IPC.SETTINGS_GET),
    set: (partial: Partial<Settings>): Promise<Settings> =>
      ipcRenderer.invoke(IPC.SETTINGS_SET, partial),
    reset: (): Promise<Settings> =>
      ipcRenderer.invoke(IPC.SETTINGS_RESET),
  },
  picker: {
    onShow: (callback: (data: { query?: string }) => void): Unsubscribe => {
      const listener = (_event: Electron.IpcRendererEvent, data: { query?: string }) => {
        callback(data)
      }
      ipcRenderer.on(IPC.PICKER_SHOW, listener)
      return () => ipcRenderer.removeListener(IPC.PICKER_SHOW, listener)
    },
    onHide: (callback: () => void): Unsubscribe => {
      const listener = () => callback()
      ipcRenderer.on(IPC.PICKER_HIDE, listener)
      return () => ipcRenderer.removeListener(IPC.PICKER_HIDE, listener)
    },
  },
}

export type CueDraftAPI = typeof api

contextBridge.exposeInMainWorld('cuedraft', api)
