/* @vitest-environment happy-dom */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardNavigation } from '../../../renderer/picker/hooks/useKeyboardNavigation'

function makeEvent(key: string): React.KeyboardEvent {
  return { key, preventDefault: () => {} } as unknown as React.KeyboardEvent
}

describe('useKeyboardNavigation', () => {
  it('starts with selectedIndex 0', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    expect(result.current.selectedIndex).toBe(0)
  })

  it('ArrowDown moves by 2 (COLUMNS)', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    act(() => result.current.onKeyDown(makeEvent('ArrowDown')))
    expect(result.current.selectedIndex).toBe(2)
  })

  it('ArrowDown clamps at itemCount - 1', () => {
    const { result } = renderHook(() => useKeyboardNavigation(3))
    act(() => result.current.setSelectedIndex(2))
    act(() => result.current.onKeyDown(makeEvent('ArrowDown')))
    expect(result.current.selectedIndex).toBe(2)
  })

  it('ArrowUp moves by -2 (COLUMNS)', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    act(() => result.current.setSelectedIndex(4))
    act(() => result.current.onKeyDown(makeEvent('ArrowUp')))
    expect(result.current.selectedIndex).toBe(2)
  })

  it('ArrowUp clamps at 0', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    act(() => result.current.onKeyDown(makeEvent('ArrowUp')))
    expect(result.current.selectedIndex).toBe(0)
  })

  it('ArrowRight increments by 1', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    act(() => result.current.onKeyDown(makeEvent('ArrowRight')))
    expect(result.current.selectedIndex).toBe(1)
  })

  it('ArrowRight clamps at itemCount - 1', () => {
    const { result } = renderHook(() => useKeyboardNavigation(3))
    act(() => result.current.setSelectedIndex(2))
    act(() => result.current.onKeyDown(makeEvent('ArrowRight')))
    expect(result.current.selectedIndex).toBe(2)
  })

  it('ArrowLeft decrements by 1', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    act(() => result.current.setSelectedIndex(3))
    act(() => result.current.onKeyDown(makeEvent('ArrowLeft')))
    expect(result.current.selectedIndex).toBe(2)
  })

  it('ArrowLeft clamps at 0', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    act(() => result.current.onKeyDown(makeEvent('ArrowLeft')))
    expect(result.current.selectedIndex).toBe(0)
  })

  it('Home sets selectedIndex to 0 from any position', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    act(() => result.current.setSelectedIndex(5))
    act(() => result.current.onKeyDown(makeEvent('Home')))
    expect(result.current.selectedIndex).toBe(0)
  })

  it('End sets selectedIndex to itemCount - 1', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    act(() => result.current.onKeyDown(makeEvent('End')))
    expect(result.current.selectedIndex).toBe(5)
  })

  it('onKeyDown does nothing when itemCount is 0', () => {
    const { result } = renderHook(() => useKeyboardNavigation(0))
    act(() => result.current.onKeyDown(makeEvent('ArrowDown')))
    expect(result.current.selectedIndex).toBe(0)
  })

  it('resetSelection sets selectedIndex back to 0', () => {
    const { result } = renderHook(() => useKeyboardNavigation(6))
    act(() => result.current.setSelectedIndex(4))
    act(() => result.current.resetSelection())
    expect(result.current.selectedIndex).toBe(0)
  })
})
