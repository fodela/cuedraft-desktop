import { useState, useEffect, useCallback } from 'react'
import type { Note } from '../../shared/types'
import { ConfirmDialog } from './components/ConfirmDialog'
import { formatLastUsed } from '../../shared/formatting'
import { obfuscatePreview } from '../../shared/privacy'

const PAGE_SIZE = 50

interface NotesScreenProps {
  onEdit: (id: number) => void
}

export function NotesScreen({ onEdit }: NotesScreenProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [total, setTotal] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkDeletePending, setBulkDeletePending] = useState(false)
  const [privacyMode, setPrivacyMode] = useState(true)

  const fetchNotes = useCallback(async () => {
    const result = await window.cuedraft.notes.list({
      search,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    })
    setNotes(result.items)
    setTotal(result.total)
  }, [page, search])

  useEffect(() => {
    window.cuedraft.settings.get().then((settings) => {
      setPrivacyMode(settings.privacyMode)
    })
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchNotes()
    }, 120)
    return () => window.clearTimeout(timeout)
  }, [fetchNotes])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [notes])

  const handleDelete = async () => {
    if (!deleteTarget) return
    await window.cuedraft.notes.delete(deleteTarget.id)
    setDeleteTarget(null)
    await fetchNotes()
  }

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(notes.map((n) => n.id)))
  }

  const handleBulkDelete = async () => {
    await window.cuedraft.notes.bulkDelete(Array.from(selectedIds))
    setSelectedIds(new Set())
    setBulkDeletePending(false)
    await fetchNotes()
  }

  const allSelected = notes.length > 0 && notes.every((n) => selectedIds.has(n.id))
  const someSelected = selectedIds.size > 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-6 px-8 pt-6 pb-0 shrink-0">
        <h1 className="text-base font-semibold text-t1">My Notes</h1>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-t3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search notes..."
              className="bg-raised border border-mid text-t2 text-xs rounded-lg pl-8 pr-4 py-2 w-52 focus:outline-none focus:border-accent placeholder:text-t4"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-8 py-4 min-h-0">
        {someSelected && (
          <div className="flex items-center justify-between px-3 py-2 mb-3 bg-raised border border-mid rounded-lg">
            <span className="text-xs text-t2">{selectedIds.size} selected</span>
            <button
              onClick={() => setBulkDeletePending(true)}
              className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-500 rounded transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}

        <div className="rounded-xl border border-low overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[32px_1fr_160px_160px_120px] bg-surface px-4 py-3 border-b border-low">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected
                }}
                className="w-3.5 h-3.5 accent-accent cursor-pointer"
              />
            </div>
            {['Title', 'Category', 'Saved On', 'Actions'].map((col) => (
              <div
                key={col}
                className="text-[10px] font-semibold tracking-wider text-t3 uppercase"
              >
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {notes.length === 0 ? (
            <div className="px-4 py-12 text-center bg-surface">
              <p className="text-t4 text-sm mb-1">No notes yet.</p>
              <p className="text-t4 text-xs">
                Edit a template in the picker and click "Save as Note" to create one.
              </p>
            </div>
          ) : (
            notes.map((n, i) => (
              <div
                key={n.id}
                className={`grid grid-cols-[32px_1fr_160px_160px_120px] px-4 py-3.5 items-center group hover:bg-raised transition-colors ${
                  selectedIds.has(n.id) ? 'bg-raised' : 'bg-surface'
                } ${i < notes.length - 1 ? 'border-b border-low' : ''}`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(n.id)}
                    onChange={() => toggleRow(n.id)}
                    className="w-3.5 h-3.5 accent-accent cursor-pointer"
                  />
                </div>

                <div className="min-w-0 pr-4">
                  <div className="text-sm font-medium text-t1 truncate">{n.title}</div>
                  <div className="text-xs text-t4 truncate mt-0.5">
                    {privacyMode
                      ? obfuscatePreview(n.content.slice(0, 50).replace(/\n/g, ' '))
                      : n.content.slice(0, 50).replace(/\n/g, ' ')}
                  </div>
                </div>

                <div>
                  {n.category ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border border-mid text-t2">
                      {n.category}
                    </span>
                  ) : (
                    <span className="text-t4 text-xs">—</span>
                  )}
                </div>

                <div className="text-sm text-t2">{formatLastUsed(n.created_at)}</div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(n.id)}
                    className="px-2.5 py-1 text-xs text-t2 hover:text-t1 rounded hover:bg-raised transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(n)}
                    className="px-2.5 py-1 text-xs text-red-500 hover:text-red-400 rounded hover:bg-raised transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-low shrink-0">
        <span className="text-[10px] tracking-widest uppercase text-t4">
          Notes · saved from picker edits
        </span>
        <span className="text-[10px] text-t3">
          {total} note{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center justify-between px-8 pb-4 shrink-0 text-xs text-t3">
        <span>
          {total.toLocaleString()} note{total !== 1 ? 's' : ''} total
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded border border-low disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded border border-low disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Note"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {bulkDeletePending && (
        <ConfirmDialog
          title="Delete Notes"
          message={`Are you sure you want to delete ${selectedIds.size} note${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDeletePending(false)}
        />
      )}
    </div>
  )
}
