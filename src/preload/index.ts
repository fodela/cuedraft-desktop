import { contextBridge, ipcRenderer } from 'electron'
import type { Template, Note, Settings } from '../shared/types'
import { IPC } from '../shared/types'

const api = {
  templates: {
    getAll: (): Promise<Template[]> =>
      ipcRenderer.invoke(IPC.TEMPLATES_GET_ALL),
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
    inject: (content: string, id?: number): Promise<void> =>
      ipcRenderer.invoke(IPC.TEMPLATES_INJECT, { content, id }),
  },
  notes: {
    getAll: (): Promise<Note[]> =>
      ipcRenderer.invoke(IPC.NOTES_GET_ALL),
    getById: (id: number): Promise<Note | undefined> =>
      ipcRenderer.invoke(IPC.NOTES_GET_BY_ID, { id }),
    create: (data: Omit<Note, 'id'>): Promise<Note> =>
      ipcRenderer.invoke(IPC.NOTES_CREATE, data),
    update: (data: Note): Promise<Note> =>
      ipcRenderer.invoke(IPC.NOTES_UPDATE, data),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC.NOTES_DELETE, { id }),
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
    onShow: (callback: (data: { query?: string }) => void): void => {
      ipcRenderer.on(IPC.PICKER_SHOW, (_event, data) => callback(data))
    },
    onHide: (callback: () => void): void => {
      ipcRenderer.on(IPC.PICKER_HIDE, () => callback())
    },
  },
}

export type CueDraftAPI = typeof api

contextBridge.exposeInMainWorld('cuedraft', api)
