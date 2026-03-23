import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { SCHEMA, _setDatabaseForTesting, closeDatabase } from '../../../main/db/database'
import {
  getAll,
  search,
  getCategories,
  getByCategory,
  getById,
  create,
  update,
  remove,
  recordUsage,
} from '../../../main/db/repository'

let testDb: Database.Database

beforeEach(() => {
  testDb = new Database(':memory:')
  testDb.pragma('journal_mode = WAL')
  testDb.exec(SCHEMA)
  _setDatabaseForTesting(testDb)
})

afterEach(() => {
  closeDatabase()
})

function insertTemplate(overrides: Partial<{ title: string; content: string; category: string | null; use_count: number; last_used: number | null }> = {}) {
  const data = {
    title: 'Test Template',
    content: 'Hello __NAME__',
    category: 'Test',
    use_count: 0,
    last_used: null,
    ...overrides,
  }
  return create(data)
}

describe('getAll', () => {
  it('returns empty array when no templates exist', () => {
    expect(getAll()).toEqual([])
  })

  it('returns all templates', () => {
    insertTemplate({ title: 'A' })
    insertTemplate({ title: 'B' })
    expect(getAll()).toHaveLength(2)
  })

  it('orders by last_used DESC NULLS LAST, then use_count DESC', () => {
    const t1 = insertTemplate({ title: 'Recent', last_used: Date.now() })
    const t2 = insertTemplate({ title: 'Never Used', last_used: null, use_count: 10 })
    const all = getAll()
    expect(all[0].id).toBe(t1.id)
    expect(all[1].id).toBe(t2.id)
  })
})

describe('search', () => {
  it('returns all templates when query is empty string', () => {
    insertTemplate({ title: 'Alpha' })
    insertTemplate({ title: 'Beta' })
    expect(search('')).toHaveLength(2)
  })

  it('returns all templates when query is whitespace only', () => {
    insertTemplate({ title: 'Alpha' })
    expect(search('   ')).toHaveLength(1)
  })

  it('returns matching templates by title', () => {
    insertTemplate({ title: 'Pain History' })
    insertTemplate({ title: 'Discharge Summary' })
    const results = search('Pain')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pain History')
  })

  it('returns matching templates by content', () => {
    insertTemplate({ title: 'A', content: 'Patient presents with __COMPLAINT__' })
    insertTemplate({ title: 'B', content: 'Something else entirely' })
    const results = search('COMPLAINT')
    expect(results).toHaveLength(1)
  })

  it('returns empty array when no templates match', () => {
    insertTemplate({ title: 'Hello World' })
    expect(search('xyz_nonexistent')).toEqual([])
  })
})

describe('getCategories', () => {
  it('returns empty array when no templates exist', () => {
    expect(getCategories()).toEqual([])
  })

  it('returns distinct category strings sorted alphabetically', () => {
    insertTemplate({ category: 'Zulu' })
    insertTemplate({ category: 'Alpha' })
    insertTemplate({ category: 'Alpha' })
    expect(getCategories()).toEqual(['Alpha', 'Zulu'])
  })

  it('excludes null categories', () => {
    insertTemplate({ category: null })
    insertTemplate({ category: 'Medical' })
    expect(getCategories()).toEqual(['Medical'])
  })
})

describe('getByCategory', () => {
  it('returns templates matching the category', () => {
    insertTemplate({ category: 'Medical' })
    insertTemplate({ category: 'Legal' })
    const results = getByCategory('Medical')
    expect(results).toHaveLength(1)
    expect(results[0].category).toBe('Medical')
  })

  it('returns empty array for nonexistent category', () => {
    insertTemplate({ category: 'Medical' })
    expect(getByCategory('Unknown')).toEqual([])
  })
})

describe('getById', () => {
  it('returns the template with the given id', () => {
    const t = insertTemplate({ title: 'My Template' })
    const result = getById(t.id)
    expect(result).not.toBeUndefined()
    expect(result!.title).toBe('My Template')
  })

  it('returns undefined for a non-existent id', () => {
    expect(getById(99999)).toBeUndefined()
  })
})

describe('create', () => {
  it('inserts a template and returns it with an assigned id', () => {
    const t = insertTemplate({ title: 'New' })
    expect(t.id).toBeGreaterThan(0)
    expect(t.title).toBe('New')
  })

  it('defaults use_count to 0', () => {
    const t = insertTemplate()
    expect(t.use_count).toBe(0)
  })

  it('allows null category', () => {
    const t = insertTemplate({ category: null })
    expect(t.category).toBeNull()
  })

  it('inserted template is searchable via FTS', () => {
    insertTemplate({ title: 'Unique XYZZY Title' })
    expect(search('XYZZY')).toHaveLength(1)
  })
})

describe('update', () => {
  it('updates title, content, and category', () => {
    const t = insertTemplate({ title: 'Original' })
    const updated = update({ ...t, title: 'Updated', content: 'New content', category: 'New Cat' })
    expect(updated.title).toBe('Updated')
    expect(updated.content).toBe('New content')
    expect(updated.category).toBe('New Cat')
  })

  it('returns the updated template', () => {
    const t = insertTemplate()
    const result = update({ ...t, title: 'Changed' })
    expect(result.id).toBe(t.id)
  })

  it('updated title is searchable via FTS', () => {
    const t = insertTemplate({ title: 'OldTitle' })
    update({ ...t, title: 'NewUniqueTitle', content: t.content, category: t.category })
    expect(search('NewUniqueTitle')).toHaveLength(1)
  })

  it('old title is no longer searchable after update', () => {
    const t = insertTemplate({ title: 'OldTitle99' })
    update({ ...t, title: 'CompletelyDifferent', content: t.content, category: t.category })
    expect(search('OldTitle99')).toHaveLength(0)
  })
})

describe('remove', () => {
  it('deletes the template with the given id', () => {
    const t = insertTemplate()
    remove(t.id)
    expect(getById(t.id)).toBeUndefined()
  })

  it('getById returns undefined after removal', () => {
    const t = insertTemplate()
    remove(t.id)
    expect(getById(t.id)).toBeUndefined()
  })

  it('removed template is not searchable via FTS', () => {
    const t = insertTemplate({ title: 'ToBeDeleted' })
    remove(t.id)
    expect(search('ToBeDeleted')).toHaveLength(0)
  })
})

describe('recordUsage', () => {
  it('increments use_count by 1', () => {
    const t = insertTemplate()
    recordUsage(t.id)
    expect(getById(t.id)!.use_count).toBe(1)
  })

  it('sets last_used to a non-null timestamp', () => {
    const t = insertTemplate()
    recordUsage(t.id)
    expect(getById(t.id)!.last_used).not.toBeNull()
  })

  it('calling recordUsage twice increments use_count to 2', () => {
    const t = insertTemplate()
    recordUsage(t.id)
    recordUsage(t.id)
    expect(getById(t.id)!.use_count).toBe(2)
  })
})
