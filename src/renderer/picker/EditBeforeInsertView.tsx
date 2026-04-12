import { useState, useEffect, useRef, useCallback } from 'react'
import { findNextPlaceholder, findPrevPlaceholder, findAllPlaceholders } from '../../shared/variables'
import type { Template } from '../../shared/types'

interface EditBeforeInsertViewProps {
  template: Template
  onConfirm: (resolvedContent: string) => void
  onBack: () => void
}

function selectAndScroll(ta: HTMLTextAreaElement, start: number, end: number) {
  ta.focus()
  ta.setSelectionRange(start, end)
  const textBefore = ta.value.substring(0, start)
  const totalLines = ta.value.split('\n').length
  const linesBefore = textBefore.split('\n').length - 1
  const lineHeight = ta.scrollHeight / Math.max(totalLines, 1)
  const targetTop = linesBefore * lineHeight - ta.clientHeight / 2
  ta.scrollTop = Math.max(0, targetTop)
}

export function EditBeforeInsertView({ template, onConfirm, onBack }: EditBeforeInsertViewProps) {
  const [content, setContent] = useState(template.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Copy to clipboard
  const [copied, setCopied] = useState(false)

  // Save as note modal
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [noteName, setNoteName] = useState(template.title)
  const [noteCategory, setNoteCategory] = useState(template.category ?? '')
  const [noteSaved, setNoteSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const noteNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    const first = findNextPlaceholder(template.content, -1)
    if (first) {
      selectAndScroll(ta, first.start, first.end)
    } else {
      ta.focus()
    }
  }, [template.content])

  // Focus note name input when modal opens
  useEffect(() => {
    if (showSaveModal) {
      setTimeout(() => noteNameRef.current?.focus(), 50)
    }
  }, [showSaveModal])

  const selectNext = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const afterIndex = ta.selectionEnd - 1
    const next = findNextPlaceholder(ta.value, afterIndex)
    if (next) {
      selectAndScroll(ta, next.start, next.end)
    } else {
      const first = findNextPlaceholder(ta.value, -1)
      if (first) selectAndScroll(ta, first.start, first.end)
    }
  }, [])

  const selectPrev = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const beforeIndex = ta.selectionStart
    const prev = findPrevPlaceholder(ta.value, beforeIndex)
    if (prev) {
      selectAndScroll(ta, prev.start, prev.end)
    } else {
      const all = findAllPlaceholders(ta.value)
      if (all.length > 0) {
        const last = all[all.length - 1]!
        selectAndScroll(ta, last.start, last.end)
      }
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) { selectPrev() } else { selectNext() }
        return
      }
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        onConfirm(content)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onBack()
        return
      }
    },
    [selectNext, selectPrev, onConfirm, onBack, content]
  )

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [content])

  const openSaveModal = useCallback(() => {
    setNoteName(template.title)
    setNoteCategory(template.category ?? '')
    setSaveError(null)
    setIsSaving(false)
    setShowSaveModal(true)
  }, [template.title, template.category])

  const handleSaveNote = useCallback(async () => {
    if (!noteName.trim()) return
    setSaveError(null)
    setIsSaving(true)
    try {
      await window.cuedraft.notes.create({
        title: noteName.trim(),
        content,
        category: noteCategory.trim() || null,
        created_at: Date.now(),
      })
      setShowSaveModal(false)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    } catch (err) {
      console.error('[CueDraft] Failed to save note:', err)
      setSaveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [noteName, noteCategory, content])

  const handleModalKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setShowSaveModal(false)
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSaveNote()
      }
    },
    [handleSaveNote]
  )

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-low shrink-0">
        <button
          onClick={onBack}
          className="text-t3 hover:text-t1 text-xs px-2 py-1 rounded hover:bg-raised shrink-0"
        >
          ← Back
        </button>
        <span className="flex-1 text-xs font-medium text-t2 truncate text-center">
          {template.title}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 text-t2 hover:text-t1 rounded hover:bg-raised shrink-0 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <button
          onClick={openSaveModal}
          className={`text-xs px-2 py-1 rounded shrink-0 transition-colors ${
            noteSaved
              ? 'text-accent'
              : 'text-t2 hover:text-t1 hover:bg-raised'
          }`}
          title="Save as note"
        >
          {noteSaved ? '✓ Saved' : 'Save Note'}
        </button>
        <button
          onClick={() => onConfirm(content)}
          className="text-xs px-3 py-1 bg-accent hover:opacity-90 text-white rounded shrink-0"
        >
          Insert
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full bg-transparent text-t1 text-sm font-mono px-3 py-2.5 resize-none focus:outline-none"
        spellCheck={false}
        autoComplete="off"
      />

      {/* Hints */}
      <div className="px-3 py-1.5 border-t border-low flex items-center gap-3 text-[10px] text-t3 shrink-0">
        <span>Tab next field</span>
        <span>⇧Tab prev</span>
        <span>Ctrl+↵ Insert</span>
        <span>Esc Back</span>
      </div>

      {/* Save as Note modal */}
      {showSaveModal && (
        <div
          className="absolute inset-0 bg-black/60 flex items-center justify-center z-50"
          onKeyDown={handleModalKeyDown}
        >
          <div className="bg-surface rounded-xl border border-low p-5 w-[280px] mx-4 shadow-xl">
            <h3 className="text-sm font-semibold text-t1 mb-4">Save as Note</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] tracking-wider uppercase text-t3 mb-1.5">
                  Note name <span className="text-accent normal-case tracking-normal">*</span>
                </label>
                <input
                  ref={noteNameRef}
                  type="text"
                  value={noteName}
                  onChange={(e) => setNoteName(e.target.value)}
                  placeholder="Enter a name..."
                  className="w-full bg-raised border border-mid text-t1 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-accent placeholder:text-t4"
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-wider uppercase text-t3 mb-1.5">
                  Category{' '}
                  <span className="text-t4 normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  placeholder="e.g. Medical, Surgical..."
                  className="w-full bg-raised border border-mid text-t1 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-accent placeholder:text-t4"
                />
              </div>
            </div>

            {saveError && (
              <p className="mt-3 text-[10px] text-red-400 bg-red-400/10 rounded px-2 py-1.5 leading-relaxed">
                {saveError}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs text-t2 hover:text-t1 rounded border border-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteName.trim() || isSaving}
                className="px-3 py-1.5 text-xs text-white bg-accent hover:opacity-90 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {isSaving ? 'Saving…' : 'Save Note'}
              </button>
            </div>

            <p className="mt-3 text-[10px] text-t4 text-center">Ctrl+↵ to save quickly</p>
          </div>
        </div>
      )}
    </div>
  )
}
