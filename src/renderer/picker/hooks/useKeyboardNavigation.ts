import { useState, useCallback } from 'react'

const COLUMNS = 2

export function useKeyboardNavigation(itemCount: number) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (itemCount === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + COLUMNS, itemCount - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - COLUMNS, 0))
          break
        case 'ArrowRight':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, itemCount - 1))
          break
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Home':
          e.preventDefault()
          setSelectedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setSelectedIndex(itemCount - 1)
          break
      }
    },
    [itemCount]
  )

  const resetSelection = useCallback(() => {
    setSelectedIndex(0)
  }, [])

  return { selectedIndex, setSelectedIndex, onKeyDown, resetSelection }
}
