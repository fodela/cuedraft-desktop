import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import * as repo from '../db/repository'
import { hidePicker } from '../windows'
import { injectText } from '../injection'

export function registerTemplateHandlers(): void {
  ipcMain.handle(IPC.TEMPLATES_GET_ALL, () => {
    return repo.getAll()
  })

  ipcMain.handle(IPC.TEMPLATES_SEARCH, (_event, { q }: { q: string }) => {
    return repo.search(q)
  })

  ipcMain.handle(IPC.TEMPLATES_GET_CATEGORIES, () => {
    return repo.getCategories()
  })

  ipcMain.handle(IPC.TEMPLATES_GET_BY_CATEGORY, (_event, { category }: { category: string }) => {
    return repo.getByCategory(category)
  })

  ipcMain.handle(IPC.TEMPLATES_GET_BY_ID, (_event, { id }: { id: number }) => {
    return repo.getById(id)
  })

  ipcMain.handle(IPC.TEMPLATES_CREATE, (_event, data) => {
    return repo.create(data)
  })

  ipcMain.handle(IPC.TEMPLATES_UPDATE, (_event, data) => {
    return repo.update(data)
  })

  ipcMain.handle(IPC.TEMPLATES_DELETE, (_event, { id }: { id: number }) => {
    return repo.remove(id)
  })

  ipcMain.handle(IPC.TEMPLATES_INJECT, async (_event, { content, id }: { content: string; id?: number }) => {
    hidePicker()
    await injectText(content)
    if (id) repo.recordUsage(id)
  })
}
