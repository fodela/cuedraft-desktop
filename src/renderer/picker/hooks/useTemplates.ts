import { useState, useEffect, useCallback, useRef } from 'react'
import type { Template } from '../../../shared/types'

const PAGE_SIZE = 200

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const requestIdRef = useRef(0)

  const nextRequestId = () => {
    requestIdRef.current += 1
    return requestIdRef.current
  }

  const fetchTemplates = useCallback(async (
    options: { search?: string; category?: string | null; includeCategories?: boolean } = {}
  ) => {
    const {
      search = '',
      category = null,
      includeCategories = false,
    } = options
    const requestId = nextRequestId()
    setIsLoading(true)

    const [result, allCategories] = await Promise.all([
      window.cuedraft.templates.list({
        search,
        category,
        limit: PAGE_SIZE,
        offset: 0,
      }),
      includeCategories
        ? window.cuedraft.templates.getCategories()
        : Promise.resolve<string[] | null>(null),
    ])

    if (requestId !== requestIdRef.current) return

    setTemplates(result.items)
    setTotal(result.total)
    if (allCategories) {
      setCategories(allCategories)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchTemplates({ includeCategories: true })
  }, [fetchTemplates])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const search = useCallback((query: string) => {
    setSearchQuery(query)
    setActiveCategory(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      await fetchTemplates({ search: query })
    }, 150)
  }, [fetchTemplates])

  const filterByCategory = useCallback(async (category: string | null) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    setActiveCategory(category)
    setSearchQuery('')

    await fetchTemplates({ category })
  }, [fetchTemplates])

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    setSearchQuery('')
    setActiveCategory(null)
    fetchTemplates({ includeCategories: true })
  }, [fetchTemplates])

  return {
    templates,
    categories,
    total,
    isLoading,
    activeCategory,
    searchQuery,
    search,
    filterByCategory,
    reset,
  }
}
