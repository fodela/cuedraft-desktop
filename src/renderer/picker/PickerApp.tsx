import { useState, useEffect, useRef, useCallback } from 'react'
import { applyAllSettings } from '../theme'
import { SearchBar } from './SearchBar'
import { CategoryFilter } from './CategoryFilter'
import { TemplateChip } from './TemplateChip'
import { EditBeforeInsertView } from './EditBeforeInsertView'
import { useTemplates } from './hooks/useTemplates'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import type { Settings, Template } from '../../shared/types'

export function PickerApp() {
  const {
    templates,
    categories,
    total,
    activeCategory,
    searchQuery,
    search,
    filterByCategory,
    reset,
  } = useTemplates()

  const { selectedIndex, setSelectedIndex, onKeyDown, resetSelection } =
    useKeyboardNavigation(templates.length)

  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null)
  const [privacyMode, setPrivacyMode] = useState<Settings['privacyMode']>(true)
  const pendingTemplateRef = useRef<Template | null>(null)

  // Keep ref in sync so the onShow callback always sees the latest value
  // without needing to be re-registered on every state change.
  useEffect(() => {
    pendingTemplateRef.current = pendingTemplate
  }, [pendingTemplate])

  useEffect(() => {
    resetSelection()
  }, [templates, resetSelection])

  useEffect(() => {
    window.cuedraft.settings.get().then((settings) => {
      setPrivacyMode(settings.privacyMode)
    })
  }, [])

  useEffect(() => {
    return window.cuedraft.picker.onShow(() => {
      // Re-apply settings each time the picker is shown so changes made in
      // the Settings window (different renderer process) are picked up.
      window.cuedraft.settings.get().then((s) => {
        setPrivacyMode(s.privacyMode)
        applyAllSettings(s)
      })

      // If the user was mid-edit, restore them to exactly where they were.
      // Only reset to the template list when there's nothing in progress.
      if (!pendingTemplateRef.current) {
        reset()
      }
    })
  }, [reset])

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
      if (pendingTemplate) return

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
      className={`relative w-[540px] ${pendingTemplate ? 'h-[540px]' : 'max-h-[520px]'} bg-surface rounded-xl shadow-2xl border border-mid flex flex-col overflow-hidden`}
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
          <div className="p-3 pb-0">
            <SearchBar value={searchQuery} onChange={search} />
          </div>

          <div className="px-3 pt-2">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onSelect={filterByCategory}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {templates.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-t3 text-sm">No templates found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template, index) => (
                  <TemplateChip
                    key={template.id}
                    template={template}
                    privacyMode={privacyMode}
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

          <div className="px-3 py-2 border-t border-low flex items-center gap-3 text-[10px] text-t3">
            <span>↵ Open</span>
            <span>Esc Close</span>
            <span>↑↓ Navigate</span>
            {total > templates.length && <span>Showing top {templates.length} of {total}</span>}
          </div>
        </>
      )}
    </div>
  )
}
