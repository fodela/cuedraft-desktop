import { useState, useEffect, useRef, useCallback } from 'react'
import { findNextPlaceholder, findPrevPlaceholder, findAllPlaceholders } from '../../shared/variables'
import type { Template } from '../../shared/types'

interface EditBeforeInsertViewProps {
  template: Template
  onConfirm: (resolvedContent: string) => void
  onBack: () => void
}

/** Select a range in the textarea and scroll so it's visible in the viewport. */
function selectAndScroll(ta: HTMLTextAreaElement, start: number, end: number) {
  ta.focus()
  ta.setSelectionRange(start, end)

  // Estimate the line containing `start` and scroll to it
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

  // Auto-focus and select the first placeholder on mount
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

  const selectNext = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const afterIndex = ta.selectionEnd - 1
    const next = findNextPlaceholder(ta.value, afterIndex)
    if (next) {
      selectAndScroll(ta, next.start, next.end)
    } else {
      // Wrap to first
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
      // Wrap to last
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
        if (e.shiftKey) {
          selectPrev()
        } else {
          selectNext()
        }
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0">
        <button
          onClick={onBack}
          className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 rounded hover:bg-zinc-800"
        >
          ← Back
        </button>
        <span className="flex-1 text-xs font-medium text-zinc-300 truncate text-center">
          {template.title}
        </span>
        <button
          onClick={() => onConfirm(content)}
          className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded"
        >
          Insert
        </button>
      </div>

      {/* Editable content */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full bg-transparent text-zinc-100 text-sm font-mono px-3 py-2.5 resize-none focus:outline-none"
        spellCheck={false}
        autoComplete="off"
      />

      {/* Hint bar */}
      <div className="px-3 py-1.5 border-t border-zinc-800 flex items-center gap-3 text-[10px] text-zinc-500 shrink-0">
        <span>Tab next field</span>
        <span>⇧Tab prev</span>
        <span>Ctrl+↵ Insert</span>
        <span>Esc Back</span>
      </div>
    </div>
  )
}
