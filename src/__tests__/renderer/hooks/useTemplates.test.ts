/* @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTemplates } from '../../../renderer/picker/hooks/useTemplates'
import type { Template } from '../../../shared/types'

const T1: Template = { id: 1, title: 'Hello', content: 'Hello {{name}}', category: 'Greet', use_count: 1, last_used: null }
const T2: Template = { id: 2, title: 'Bye', content: 'Goodbye {{name}}', category: 'Greet', use_count: 0, last_used: null }
const T3: Template = { id: 3, title: 'Legal', content: 'Re: case {{id}}', category: 'Legal', use_count: 2, last_used: null }

describe('useTemplates', () => {
  beforeEach(() => {
    ;(window.cuedraft.templates.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [T1, T2, T3],
      total: 3,
    })
    ;(window.cuedraft.templates.getCategories as ReturnType<typeof vi.fn>).mockResolvedValue(['Greet', 'Legal'])
  })

  it('fetches templates and categories on mount', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.templates).toEqual([T1, T2, T3])
    expect(result.current.categories).toEqual(['Greet', 'Legal'])
    expect(result.current.total).toBe(3)
  })

  it('starts with null activeCategory and empty searchQuery', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeCategory).toBeNull()
    expect(result.current.searchQuery).toBe('')
  })

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

  it('search() calls templates.list after 150ms debounce', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    ;(window.cuedraft.templates.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      items: [T1],
      total: 1,
    })

    act(() => { result.current.search('hello') })
    expect(window.cuedraft.templates.list).toHaveBeenCalledTimes(1)

    await waitFor(
      () => expect(window.cuedraft.templates.list).toHaveBeenLastCalledWith({
        search: 'hello',
        category: null,
        limit: 200,
        offset: 0,
      }),
      { timeout: 1000 }
    )
    await waitFor(() => expect(result.current.templates).toEqual([T1]))
  }, 3000)

  it('search("") requests the default list', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => { result.current.search('') })
    await waitFor(
      () => expect(window.cuedraft.templates.list).toHaveBeenCalledTimes(2),
      { timeout: 1000 }
    )
    expect(window.cuedraft.templates.list).toHaveBeenLastCalledWith({
      search: '',
      category: null,
      limit: 200,
      offset: 0,
    })
  }, 3000)

  it('rapid search only issues one final debounced query', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.search('h')
      result.current.search('he')
      result.current.search('hel')
    })

    await waitFor(
      () => expect(window.cuedraft.templates.list).toHaveBeenCalledTimes(2),
      { timeout: 1000 }
    )
    expect(window.cuedraft.templates.list).toHaveBeenLastCalledWith({
      search: 'hel',
      category: null,
      limit: 200,
      offset: 0,
    })
  }, 3000)

  it('filterByCategory(category) sets activeCategory and fetches that category', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    ;(window.cuedraft.templates.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      items: [T3],
      total: 1,
    })

    await act(async () => { await result.current.filterByCategory('Legal') })
    expect(result.current.activeCategory).toBe('Legal')
    expect(window.cuedraft.templates.list).toHaveBeenLastCalledWith({
      search: '',
      category: 'Legal',
      limit: 200,
      offset: 0,
    })
    expect(result.current.templates).toEqual([T3])
  })

  it('filterByCategory(null) clears category and fetches the default list', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => { await result.current.filterByCategory('Legal') })
    await act(async () => { await result.current.filterByCategory(null) })
    expect(result.current.activeCategory).toBeNull()
    expect(window.cuedraft.templates.list).toHaveBeenLastCalledWith({
      search: '',
      category: null,
      limit: 200,
      offset: 0,
    })
  })

  it('filterByCategory clears searchQuery', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => { result.current.search('hello') })
    expect(result.current.searchQuery).toBe('hello')
    await act(async () => { await result.current.filterByCategory('Legal') })
    expect(result.current.searchQuery).toBe('')
  })

  it('reset() clears searchQuery and activeCategory', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => { result.current.search('hello') })
    await act(async () => { await result.current.filterByCategory('Legal') })
    act(() => { result.current.reset() })
    expect(result.current.searchQuery).toBe('')
    expect(result.current.activeCategory).toBeNull()
  })

  it('reset() refetches the default list', async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => { result.current.reset() })
    await waitFor(() =>
      expect(window.cuedraft.templates.list).toHaveBeenCalledTimes(2)
    )
  })
})
