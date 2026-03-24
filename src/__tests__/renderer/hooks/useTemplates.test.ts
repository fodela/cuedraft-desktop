/* @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTemplates } from '../../../renderer/picker/hooks/useTemplates'
import type { Template } from '../../../shared/types'

const T1: Template = { id: 1, title: 'Hello', content: 'Hello {{name}}', category: 'Greet', use_count: 1, last_used: null }
const T2: Template = { id: 2, title: 'Bye',   content: 'Goodbye {{name}}', category: 'Greet', use_count: 0, last_used: null }
const T3: Template = { id: 3, title: 'Legal', content: 'Re: case {{id}}',  category: 'Legal', use_count: 2, last_used: null }

describe('useTemplates', () => {
  beforeEach(() => {
    ;(window.cuedraft.templates.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([T1, T2, T3])
    ;(window.cuedraft.templates.getCategories as ReturnType<typeof vi.fn>).mockResolvedValue(['Greet', 'Legal'])
    ;(window.cuedraft.templates.search as ReturnType<typeof vi.fn>).mockResolvedValue([T1])
    ;(window.cuedraft.templates.getByCategory as ReturnType<typeof vi.fn>).mockResolvedValue([T3])
  })

  // ── Initial fetch ──────────────────────────────────────────────────────────

  it('fetches all templates and categories on mount', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.templates).toEqual([T1, T2, T3])
    expect(result.current.categories).toEqual(['Greet', 'Legal'])
  })

  it('starts with null activeCategory and empty searchQuery', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeCategory).toBeNull()
    expect(result.current.searchQuery).toBe('')
  })

  // ── search() ──────────────────────────────────────────────────────────────

  it('search() updates searchQuery immediately', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => { result.current.search('hello') })
    expect(result.current.searchQuery).toBe('hello')
  })

  it('search() clears activeCategory immediately', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => { await result.current.filterByCategory('Legal') })
    expect(result.current.activeCategory).toBe('Legal')
    act(() => { result.current.search('hello') })
    expect(result.current.activeCategory).toBeNull()
  })

  it('search() calls templates.search after 150ms debounce', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => { result.current.search('hello') })
    // templates.search not called yet (debounce pending)
    expect(window.cuedraft.templates.search).not.toHaveBeenCalled()

    // Wait up to 1s for the 150ms debounce to fire
    await waitFor(
      () => expect(window.cuedraft.templates.search).toHaveBeenCalledWith('hello'),
      { timeout: 1000 }
    )
    await waitFor(() => expect(result.current.templates).toEqual([T1]))
  }, 3000)

  it('search("") calls templates.getAll instead of search', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => { result.current.search('') })
    await waitFor(
      () => expect(window.cuedraft.templates.getAll).toHaveBeenCalledTimes(2),
      { timeout: 1000 }
    )
    expect(window.cuedraft.templates.search).not.toHaveBeenCalled()
  }, 3000)

  it('rapid search — debounce fires only once with the last query', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Fire three searches synchronously — each clears the previous debounce timer
    act(() => {
      result.current.search('h')
      result.current.search('he')
      result.current.search('hel')
    })
    expect(result.current.searchQuery).toBe('hel')

    await waitFor(
      () => expect(window.cuedraft.templates.search).toHaveBeenCalledTimes(1),
      { timeout: 1000 }
    )
    expect(window.cuedraft.templates.search).toHaveBeenCalledWith('hel')
  }, 3000)

  // ── filterByCategory() ────────────────────────────────────────────────────

  it('filterByCategory(category) sets activeCategory and fetches by category', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => { await result.current.filterByCategory('Legal') })
    expect(result.current.activeCategory).toBe('Legal')
    expect(window.cuedraft.templates.getByCategory).toHaveBeenCalledWith('Legal')
    expect(result.current.templates).toEqual([T3])
  })

  it('filterByCategory(null) fetches all templates and clears category', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => { await result.current.filterByCategory('Legal') })
    await act(async () => { await result.current.filterByCategory(null) })
    expect(result.current.activeCategory).toBeNull()
    // getAll: mount + filterByCategory(null)
    expect(window.cuedraft.templates.getAll).toHaveBeenCalledTimes(2)
  })

  it('filterByCategory clears searchQuery', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => { result.current.search('hello') })
    expect(result.current.searchQuery).toBe('hello')
    await act(async () => { await result.current.filterByCategory('Legal') })
    expect(result.current.searchQuery).toBe('')
  })

  // ── reset() ───────────────────────────────────────────────────────────────

  it('reset() clears searchQuery and activeCategory', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => { result.current.search('hello') })
    await act(async () => { await result.current.filterByCategory('Legal') })
    act(() => { result.current.reset() })
    expect(result.current.searchQuery).toBe('')
    expect(result.current.activeCategory).toBeNull()
  })

  it('reset() refetches all templates', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => { result.current.reset() })
    await waitFor(() =>
      expect(window.cuedraft.templates.getAll).toHaveBeenCalledTimes(2)
    )
  })
})
