import type { ListQuery, ListResult, Note } from '../../shared/types'
import { getDatabase } from './database'

export function getAll(): Note[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM notes ORDER BY created_at DESC')
    .all() as Note[]
}

export function list(query: Required<ListQuery>): ListResult<Note> {
  const db = getDatabase()
  const conditions: string[] = []
  const params: Array<string | number> = []

  if (query.category) {
    conditions.push('category = ?')
    params.push(query.category)
  }

  if (query.search.trim()) {
    conditions.push(
      `(instr(lower(title), lower(?)) > 0 OR instr(lower(coalesce(category, '')), lower(?)) > 0)`
    )
    params.push(query.search, query.search)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM notes ${whereClause}`)
    .get(...params) as { count: number }

  const items = db
    .prepare(
      `SELECT * FROM notes
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, query.limit, query.offset) as Note[]

  return { items, total: countRow.count }
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

export function removeMany(ids: number[]): void {
  if (ids.length === 0) return

  const db = getDatabase()
  const placeholders = ids.map(() => '?').join(', ')

  db.transaction((noteIds: number[]) => {
    db.prepare(`DELETE FROM notes WHERE id IN (${placeholders})`).run(...noteIds)
  })(ids)
}
