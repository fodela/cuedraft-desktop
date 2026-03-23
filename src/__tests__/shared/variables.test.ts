import { describe, it, expect } from 'vitest'
import {
  findAllPlaceholders,
  findNextPlaceholder,
  findPrevPlaceholder,
  hasPlaceholders,
} from '../../shared/variables'

describe('findAllPlaceholders', () => {
  it('returns empty array for string with no placeholders', () => {
    expect(findAllPlaceholders('hello world')).toEqual([])
  })

  it('returns single match with correct name, start, end', () => {
    const result = findAllPlaceholders('Hello __NAME__')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('NAME')
    expect(result[0].start).toBe(6)
    expect(result[0].end).toBe(14)
  })

  it('returns multiple matches in order', () => {
    const result = findAllPlaceholders('__FIRST__ and __SECOND__')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('FIRST')
    expect(result[1].name).toBe('SECOND')
  })

  it('does not match lowercase placeholders', () => {
    expect(findAllPlaceholders('__lower__ and __Mixed__')).toEqual([])
  })

  it('does not match single underscore each side', () => {
    expect(findAllPlaceholders('_NAME_')).toEqual([])
  })

  it('returns correct end index (start + token length)', () => {
    // __COMPLAINT__ is 13 chars
    const result = findAllPlaceholders('PC: __COMPLAINT__')
    expect(result[0].start).toBe(4)
    expect(result[0].end).toBe(4 + '__COMPLAINT__'.length)
  })

  it('handles placeholder at start of string', () => {
    const result = findAllPlaceholders('__A__ some text')
    expect(result[0].start).toBe(0)
  })

  it('matches placeholders with numbers and underscores in name', () => {
    const result = findAllPlaceholders('__SPO2__ and __DVT_PROPHYLAXIS__')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('SPO2')
    expect(result[1].name).toBe('DVT_PROPHYLAXIS')
  })
})

describe('findNextPlaceholder', () => {
  const content = '__FIRST__ some text __SECOND__ more __THIRD__'

  it('returns first placeholder when afterIndex is -1', () => {
    const result = findNextPlaceholder(content, -1)
    expect(result).not.toBeNull()
    expect(result!.start).toBe(0)
  })

  it('returns placeholder after given index', () => {
    // afterIndex = end of __FIRST__ (9-1=8), so should get __SECOND__
    const result = findNextPlaceholder(content, 8)
    expect(result).not.toBeNull()
    const secondStart = content.indexOf('__SECOND__')
    expect(result!.start).toBe(secondStart)
  })

  it('returns null when no placeholder exists after given index', () => {
    const end = content.lastIndexOf('__THIRD__') + '__THIRD__'.length
    expect(findNextPlaceholder(content, end)).toBeNull()
  })

  it('returns null for string with no placeholders', () => {
    expect(findNextPlaceholder('no placeholders here', -1)).toBeNull()
  })

  it('skips placeholder at or before afterIndex', () => {
    // afterIndex right at start of __SECOND__
    const secondStart = content.indexOf('__SECOND__')
    const result = findNextPlaceholder(content, secondStart)
    const thirdStart = content.indexOf('__THIRD__')
    expect(result!.start).toBe(thirdStart)
  })
})

describe('findPrevPlaceholder', () => {
  const content = '__FIRST__ some text __SECOND__ more __THIRD__'

  it('returns null when beforeIndex is 0', () => {
    expect(findPrevPlaceholder(content, 0)).toBeNull()
  })

  it('returns null for string with no placeholders', () => {
    expect(findPrevPlaceholder('no placeholders', 100)).toBeNull()
  })

  it('returns rightmost placeholder before beforeIndex', () => {
    // beforeIndex = start of __THIRD__
    const thirdStart = content.indexOf('__THIRD__')
    const result = findPrevPlaceholder(content, thirdStart)
    expect(result).not.toBeNull()
    const secondStart = content.indexOf('__SECOND__')
    expect(result!.start).toBe(secondStart)
  })

  it('returns null when beforeIndex is before all placeholders', () => {
    expect(findPrevPlaceholder(content, 0)).toBeNull()
  })

  it('returns first placeholder when beforeIndex is in the middle', () => {
    const secondStart = content.indexOf('__SECOND__')
    const result = findPrevPlaceholder(content, secondStart)
    expect(result!.start).toBe(0)
  })
})

describe('hasPlaceholders', () => {
  it('returns true for string containing one placeholder', () => {
    expect(hasPlaceholders('Hello __NAME__')).toBe(true)
  })

  it('returns false for string with no placeholders', () => {
    expect(hasPlaceholders('no placeholders here')).toBe(false)
  })

  it('returns false for lowercase __lower__', () => {
    expect(hasPlaceholders('__lower__')).toBe(false)
  })

  it('returns true for placeholder embedded in prose', () => {
    expect(hasPlaceholders('Patient presents with __COMPLAINT__ since __DURATION__.')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(hasPlaceholders('')).toBe(false)
  })
})
