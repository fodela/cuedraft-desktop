import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import * as repo from '../db/notes-repository'
import {
  validateListQuery,
  validateIdPayload,
  validateIdListPayload,
  validateNoteCreateData,
  validateNoteUpdateData,
} from '../validation'

export function registerNoteHandlers(): void {
  ipcMain.handle(IPC.NOTES_GET_ALL, () => {
    return repo.getAll()
  })

  ipcMain.handle(IPC.NOTES_LIST, (_event, payload) => {
    return repo.list(validateListQuery(payload))
  })

  ipcMain.handle(IPC.NOTES_GET_BY_ID, (_event, payload) => {
    const id = validateIdPayload(payload)
    return repo.getById(id)
  })

  ipcMain.handle(IPC.NOTES_CREATE, (_event, data) => {
    return repo.create(validateNoteCreateData(data))
  })

  ipcMain.handle(IPC.NOTES_UPDATE, (_event, data) => {
    return repo.update(validateNoteUpdateData(data))
  })

  ipcMain.handle(IPC.NOTES_DELETE, (_event, payload) => {
    const id = validateIdPayload(payload)
    return repo.remove(id)
  })

  ipcMain.handle(IPC.NOTES_BULK_DELETE, (_event, payload) => {
    const ids = validateIdListPayload(payload)
    return repo.removeMany(ids)
  })
}
