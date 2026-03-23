import type { Template } from '../../shared/types'
import { getDatabase } from './database'

export function getAll(): Template[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM templates ORDER BY last_used DESC NULLS LAST, use_count DESC')
    .all() as Template[]
}

export function search(q: string): Template[] {
  const db = getDatabase()
  if (!q.trim()) return getAll()
  return db
    .prepare(
      `SELECT t.* FROM templates t
       JOIN templates_fts f ON t.id = f.rowid
       WHERE templates_fts MATCH ?
       ORDER BY rank`
    )
    .all(q + '*') as Template[]
}

export function getCategories(): string[] {
  const db = getDatabase()
  const rows = db
    .prepare('SELECT DISTINCT category FROM templates WHERE category IS NOT NULL ORDER BY category')
    .all() as { category: string }[]
  return rows.map((r) => r.category)
}

export function getByCategory(category: string): Template[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM templates WHERE category = ? ORDER BY last_used DESC NULLS LAST, use_count DESC')
    .all(category) as Template[]
}

export function getById(id: number): Template | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as Template | undefined
}

export function create(data: Omit<Template, 'id'>): Template {
  const db = getDatabase()
  const result = db
    .prepare('INSERT INTO templates (title, content, category, use_count, last_used) VALUES (?, ?, ?, ?, ?)')
    .run(data.title, data.content, data.category, data.use_count ?? 0, data.last_used ?? null)
  return getById(Number(result.lastInsertRowid))!
}

export function update(data: Template): Template {
  const db = getDatabase()
  db.prepare('UPDATE templates SET title = ?, content = ?, category = ? WHERE id = ?')
    .run(data.title, data.content, data.category, data.id)
  return getById(data.id)!
}

export function remove(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM templates WHERE id = ?').run(id)
}

export function recordUsage(id: number): void {
  const db = getDatabase()
  db.prepare('UPDATE templates SET use_count = use_count + 1, last_used = ? WHERE id = ?')
    .run(Date.now(), id)
}
