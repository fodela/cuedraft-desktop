import type { Note } from '../../shared/types'
import { getDatabase } from './database'

export function getAll(): Note[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM notes ORDER BY created_at DESC')
    .all() as Note[]
}

export function getById(id: number): Note | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined
}

export function create(data: Omit<Note, 'id'>): Note {
  const db = getDatabase()
  const result = db
    .prepare('INSERT INTO notes (title, content, category, created_at) VALUES (?, ?, ?, ?)')
    .run(data.title, data.content, data.category, data.created_at ?? Date.now())
  return getById(Number(result.lastInsertRowid))!
}

export function update(data: Note): Note {
  const db = getDatabase()
  db.prepare('UPDATE notes SET title = ?, content = ?, category = ? WHERE id = ?')
    .run(data.title, data.content, data.category, data.id)
  return getById(data.id)!
}

export function remove(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM notes WHERE id = ?').run(id)
}
