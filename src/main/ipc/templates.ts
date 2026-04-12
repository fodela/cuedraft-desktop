import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import * as repo from '../db/repository'
import { hidePicker } from '../windows'
import { injectText } from '../injection'
import { getSettings } from '../db/settings-store'
import {
  validateListQuery,
  validateCategoryPayload,
  validateIdPayload,
  validateIdListPayload,
  validateInjectionPayload,
  validateSearchPayload,
  validateTemplateCreateData,
  validateTemplateUpdateData,
} from '../validation'

export function registerTemplateHandlers(): void {
  ipcMain.handle(IPC.TEMPLATES_GET_ALL, () => {
    return repo.getAll()
  })

  ipcMain.handle(IPC.TEMPLATES_LIST, (_event, payload) => {
    return repo.list(validateListQuery(payload))
  })

  ipcMain.handle(IPC.TEMPLATES_SEARCH, (_event, payload) => {
    const q = validateSearchPayload(payload)
    return repo.search(q)
  })

  ipcMain.handle(IPC.TEMPLATES_GET_CATEGORIES, () => {
    return repo.getCategories()
  })

  ipcMain.handle(IPC.TEMPLATES_GET_BY_CATEGORY, (_event, payload) => {
    const category = validateCategoryPayload(payload)
    return repo.getByCategory(category)
  })

  ipcMain.handle(IPC.TEMPLATES_GET_BY_ID, (_event, payload) => {
    const id = validateIdPayload(payload)
    return repo.getById(id)
  })

  ipcMain.handle(IPC.TEMPLATES_CREATE, (_event, data) => {
    return repo.create(validateTemplateCreateData(data))
  })

  ipcMain.handle(IPC.TEMPLATES_UPDATE, (_event, data) => {
    return repo.update(validateTemplateUpdateData(data))
  })

  ipcMain.handle(IPC.TEMPLATES_DELETE, (_event, payload) => {
    const id = validateIdPayload(payload)
    return repo.remove(id)
  })

  ipcMain.handle(IPC.TEMPLATES_BULK_DELETE, (_event, payload) => {
    const ids = validateIdListPayload(payload)
    return repo.removeMany(ids)
  })

  ipcMain.handle(IPC.TEMPLATES_INJECT, async (_event, payload) => {
    const { content, id } = validateInjectionPayload(payload)
    const settings = getSettings()
    hidePicker()
    await injectText(content, settings.injectionMethod)
    if (id) repo.recordUsage(id)
  })
}
