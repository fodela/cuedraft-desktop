import { useState, useEffect, useCallback } from 'react'
import { SearchBar } from './SearchBar'
import { CategoryFilter } from './CategoryFilter'
import { TemplateChip } from './TemplateChip'
import { EditBeforeInsertView } from './EditBeforeInsertView'
import { useTemplates } from './hooks/useTemplates'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import type { Template } from '../../shared/types'

export function PickerApp() {
  const {
    templates,
    categories,
    activeCategory,
    searchQuery,
    search,
    filterByCategory,
    reset,
  } = useTemplates()

  const { selectedIndex, setSelectedIndex, onKeyDown, resetSelection } =
    useKeyboardNavigation(templates.length)

  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null)

  // Reset selection when templates change
  useEffect(() => {
    resetSelection()
  }, [templates, resetSelection])

  // Listen for picker show — reset state
  useEffect(() => {
    window.cuedraft.picker.onShow(() => {
      setPendingTemplate(null)
      reset()
    })
  }, [reset])

  // All templates go through the edit view before inserting
  const handleSelect = useCallback((template: Template) => {
    setPendingTemplate(template)
  }, [])

  const handleEditConfirm = useCallback(
    (resolvedContent: string) => {
      if (pendingTemplate) {
        window.cuedraft.templates.inject(resolvedContent, pendingTemplate.id)
      }
      setPendingTemplate(null)
    },
    [pendingTemplate]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (pendingTemplate) return // EditBeforeInsertView owns all keys

      if (e.key === 'Enter' && templates.length > 0) {
        e.preventDefault()
        handleSelect(templates[selectedIndex]!)
        return
      }
      onKeyDown(e)
    },
    [onKeyDown, templates, selectedIndex, handleSelect, pendingTemplate]
  )

  return (
    <div
      className={`relative w-[540px] ${pendingTemplate ? 'h-[540px]' : 'max-h-[520px]'} bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700 flex flex-col overflow-hidden`}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {pendingTemplate ? (
        <EditBeforeInsertView
          template={pendingTemplate}
          onConfirm={handleEditConfirm}
          onBack={() => setPendingTemplate(null)}
        />
      ) : (
        <>
          {/* Search */}
          <div className="p-3 pb-0">
            <SearchBar value={searchQuery} onChange={search} />
          </div>

          {/* Category filter */}
          <div className="px-3 pt-2">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onSelect={filterByCategory}
            />
          </div>

          {/* Template grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {templates.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-zinc-500 text-sm">No templates found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template, index) => (
                  <TemplateChip
                    key={template.id}
                    template={template}
                    isSelected={index === selectedIndex}
                    onClick={() => {
                      setSelectedIndex(index)
                      handleSelect(template)
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom hint bar */}
          <div className="px-3 py-2 border-t border-zinc-800 flex items-center gap-3 text-[10px] text-zinc-500">
            <span>↵ Open</span>
            <span>Esc Close</span>
            <span>↑↓ Navigate</span>
          </div>
        </>
      )}
    </div>
  )
}
