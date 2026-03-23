import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatLastUsed } from '../../shared/formatting'

const NOW = new Date('2025-01-15T12:00:00Z').getTime()

beforeEach(() => {
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('formatLastUsed', () => {
  it('returns "Never" for null', () => {
    expect(formatLastUsed(null)).toBe('Never')
  })

  it('returns "Just now" for a timestamp less than 1 hour ago', () => {
    expect(formatLastUsed(NOW - 30 * 60_000)).toBe('Just now')
  })

  it('returns "Xh ago" for 1–23 hours ago', () => {
    expect(formatLastUsed(NOW - 3 * 3_600_000)).toBe('3h ago')
    expect(formatLastUsed(NOW - 23 * 3_600_000)).toBe('23h ago')
  })

  it('returns "Yesterday" for 24–47 hours ago', () => {
    expect(formatLastUsed(NOW - 25 * 3_600_000)).toBe('Yesterday')
  })

  it('returns "Xd ago" for 2–6 days ago', () => {
    expect(formatLastUsed(NOW - 3 * 86_400_000)).toBe('3d ago')
    expect(formatLastUsed(NOW - 6 * 86_400_000)).toBe('6d ago')
  })

  it('returns "Xw ago" for 1–3 weeks ago', () => {
    expect(formatLastUsed(NOW - 7 * 86_400_000)).toBe('1w ago')
    expect(formatLastUsed(NOW - 21 * 86_400_000)).toBe('3w ago')
  })

  it('returns "Xmo ago" for more than 4 weeks ago', () => {
    expect(formatLastUsed(NOW - 35 * 86_400_000)).toBe('1mo ago')
    expect(formatLastUsed(NOW - 60 * 86_400_000)).toBe('2mo ago')
  })
})
