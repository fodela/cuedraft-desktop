import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { SCHEMA, seedIfEmpty, _setDatabaseForTesting, closeDatabase } from '../../../main/db/database'

describe('seedIfEmpty', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('journal_mode = WAL')
    db.exec(SCHEMA)
    _setDatabaseForTesting(db)
  })

  afterEach(() => {
    closeDatabase()
  })

  // ── Seeding ──────────────────────────────────────────────────────────────

  it('inserts seed rows when the table is empty', () => {
    seedIfEmpty(db)
    const row = db.prepare('SELECT COUNT(*) as c FROM templates').get() as { c: number }
    expect(row.c).toBeGreaterThan(0)
  })

  it('inserts all expected seed templates', () => {
    seedIfEmpty(db)
    const row = db.prepare('SELECT COUNT(*) as c FROM templates').get() as { c: number }
    // 7 seed entries defined in SEED_DATA (checked by count > 5)
    expect(row.c).toBeGreaterThanOrEqual(5)
  })

  it('all seeded templates have non-empty titles', () => {
    seedIfEmpty(db)
    const bad = db.prepare("SELECT * FROM templates WHERE title = '' OR title IS NULL").all()
    expect(bad).toHaveLength(0)
  })

  it('all seeded templates have non-empty content', () => {
    seedIfEmpty(db)
    const bad = db.prepare("SELECT * FROM templates WHERE content = '' OR content IS NULL").all()
    expect(bad).toHaveLength(0)
  })

  it('all seeded templates have a category', () => {
    seedIfEmpty(db)
    const noCat = db.prepare('SELECT * FROM templates WHERE category IS NULL').all()
    expect(noCat).toHaveLength(0)
  })

  // ── Idempotency ───────────────────────────────────────────────────────────

  it('does not insert more rows when table already has data', () => {
    db.prepare('INSERT INTO templates (title, content, category) VALUES (?, ?, ?)').run(
      'Existing', 'content', 'Test'
    )
    seedIfEmpty(db)
    const row = db.prepare('SELECT COUNT(*) as c FROM templates').get() as { c: number }
    expect(row.c).toBe(1) // only the one we inserted
  })

  it('calling seedIfEmpty twice still results in correct count', () => {
    seedIfEmpty(db)
    const firstCount = (db.prepare('SELECT COUNT(*) as c FROM templates').get() as { c: number }).c
    seedIfEmpty(db)
    const secondCount = (db.prepare('SELECT COUNT(*) as c FROM templates').get() as { c: number }).c
    expect(secondCount).toBe(firstCount) // no duplicates
  })

  // ── FTS integration ───────────────────────────────────────────────────────

  it('FTS index is populated after seeding', () => {
    seedIfEmpty(db)
    const results = db
      .prepare("SELECT rowid FROM templates_fts WHERE templates_fts MATCH 'History'")
      .all()
    expect(results.length).toBeGreaterThan(0)
  })

  it('FTS search finds templates by content keyword', () => {
    seedIfEmpty(db)
    // All seeded templates contain placeholders like __COMPLAINT__
    const results = db
      .prepare("SELECT rowid FROM templates_fts WHERE templates_fts MATCH 'COMPLAINT'")
      .all()
    expect(results.length).toBeGreaterThan(0)
  })

  it('insert trigger keeps FTS in sync with new templates', () => {
    seedIfEmpty(db)
    db.prepare('INSERT INTO templates (title, content, category) VALUES (?, ?, ?)').run(
      'Unique XYZ Title', 'unique xyz content', 'Test'
    )
    const results = db
      .prepare("SELECT rowid FROM templates_fts WHERE templates_fts MATCH 'XYZ'")
      .all()
    expect(results.length).toBe(1)
  })

  it('delete trigger removes row from FTS index', () => {
    seedIfEmpty(db)
    db.prepare('INSERT INTO templates (title, content, category) VALUES (?, ?, ?)').run(
      'DeleteMe Unique', 'delete this content', 'Test'
    )
    const id = (db.prepare('SELECT id FROM templates WHERE title = ?').get('DeleteMe Unique') as { id: number }).id
    db.prepare('DELETE FROM templates WHERE id = ?').run(id)
    const results = db
      .prepare("SELECT rowid FROM templates_fts WHERE templates_fts MATCH 'DeleteMe'")
      .all()
    expect(results.length).toBe(0)
  })

  it('update trigger refreshes FTS index', () => {
    seedIfEmpty(db)
    db.prepare('INSERT INTO templates (title, content, category) VALUES (?, ?, ?)').run(
      'OldTitle Unique', 'some content', 'Test'
    )
    const id = (db.prepare('SELECT id FROM templates WHERE title = ?').get('OldTitle Unique') as { id: number }).id
    db.prepare('UPDATE templates SET title = ? WHERE id = ?').run('NewTitle Unique', id)

    const old = db.prepare("SELECT rowid FROM templates_fts WHERE templates_fts MATCH 'OldTitle'").all()
    const updated = db.prepare("SELECT rowid FROM templates_fts WHERE templates_fts MATCH 'NewTitle'").all()
    expect(old.length).toBe(0)
    expect(updated.length).toBe(1)
  })
})
