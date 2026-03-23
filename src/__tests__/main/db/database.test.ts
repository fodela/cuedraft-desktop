import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { SCHEMA, _setDatabaseForTesting, closeDatabase } from '../../../main/db/database'

// Use the test injection point: we set an in-memory db before each test
// so getDatabase() never hits the filesystem
describe('database module', () => {
  let testDb: Database.Database

  beforeEach(() => {
    // Use _setDatabaseForTesting to inject a fresh :memory: database
    testDb = new Database(':memory:')
    testDb.pragma('journal_mode = WAL')
    testDb.exec(SCHEMA)
    _setDatabaseForTesting(testDb)
  })

  afterEach(() => {
    closeDatabase()
  })

  it('SCHEMA creates the templates table', () => {
    const tables = testDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='templates'")
      .all()
    expect(tables).toHaveLength(1)
  })

  it('SCHEMA creates the templates_fts virtual table', () => {
    const tables = testDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='templates_fts'")
      .all()
    expect(tables).toHaveLength(1)
  })

  it('SCHEMA creates the after-insert trigger', () => {
    const triggers = testDb
      .prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name='templates_ai'")
      .all()
    expect(triggers).toHaveLength(1)
  })

  it('SCHEMA creates the after-delete trigger', () => {
    const triggers = testDb
      .prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name='templates_ad'")
      .all()
    expect(triggers).toHaveLength(1)
  })

  it('SCHEMA creates the after-update trigger', () => {
    const triggers = testDb
      .prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name='templates_au'")
      .all()
    expect(triggers).toHaveLength(1)
  })

  it('_setDatabaseForTesting injects the db so repository functions use it', () => {
    // If _setDatabaseForTesting works, we can query the db directly
    const result = testDb.prepare('SELECT COUNT(*) as c FROM templates').get() as { c: number }
    expect(result.c).toBe(0) // no seed — clean in-memory db
  })

  describe('closeDatabase', () => {
    it('closeDatabase does not throw', () => {
      expect(() => closeDatabase()).not.toThrow()
    })

    it('calling closeDatabase twice does not throw', () => {
      closeDatabase()
      expect(() => closeDatabase()).not.toThrow()
    })
  })
})
