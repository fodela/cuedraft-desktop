import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import * as repo from '../db/notes-repository'

export function registerNoteHandlers(): void {
  ipcMain.handle(IPC.NOTES_GET_ALL, () => {
    return repo.getAll()
  })

  ipcMain.handle(IPC.NOTES_GET_BY_ID, (_event, { id }: { id: number }) => {
    return repo.getById(id)
  })

  ipcMain.handle(IPC.NOTES_CREATE, (_event, data) => {
    return repo.create(data)
  })

  ipcMain.handle(IPC.NOTES_UPDATE, (_event, data) => {
    return repo.update(data)
  })

  ipcMain.handle(IPC.NOTES_DELETE, (_event, { id }: { id: number }) => {
    return repo.remove(id)
  })
}
