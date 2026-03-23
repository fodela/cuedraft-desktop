import { useState, useEffect, useCallback, useRef } from 'react'
import type { Template } from '../../../shared/types'

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    const [allTemplates, allCategories] = await Promise.all([
      window.cuedraft.templates.getAll(),
      window.cuedraft.templates.getCategories(),
    ])
    setTemplates(allTemplates)
    setCategories(allCategories)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const search = useCallback((query: string) => {
    setSearchQuery(query)
    setActiveCategory(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      if (!query.trim()) {
        const all = await window.cuedraft.templates.getAll()
        setTemplates(all)
      } else {
        const results = await window.cuedraft.templates.search(query)
        setTemplates(results)
      }
    }, 150)
  }, [])

  const filterByCategory = useCallback(async (category: string | null) => {
    setActiveCategory(category)
    setSearchQuery('')

    if (!category) {
      const all = await window.cuedraft.templates.getAll()
      setTemplates(all)
    } else {
      const filtered = await window.cuedraft.templates.getByCategory(category)
      setTemplates(filtered)
    }
  }, [])

  const reset = useCallback(() => {
    setSearchQuery('')
    setActiveCategory(null)
    fetchAll()
  }, [fetchAll])

  return {
    templates,
    categories,
    isLoading,
    activeCategory,
    searchQuery,
    search,
    filterByCategory,
    reset,
  }
}
