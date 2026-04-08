import { useState, useEffect } from 'react'
import type { Note } from '../../shared/types'

interface EditNoteScreenProps {
  noteId: number
  onSave: () => void
  onCancel: () => void
}

export function EditNoteScreen({ noteId, onSave, onCancel }: EditNoteScreenProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    window.cuedraft.notes.getById(noteId).then((n) => {
      if (n) {
        setTitle(n.title)
        setContent(n.content)
        setCategory(n.category ?? '')
      }
    })
  }, [noteId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    const data: Note = {
      id: noteId,
      title: title.trim(),
      content,
      category: category.trim() || null,
      created_at: Date.now(),
    }

    await window.cuedraft.notes.update(data)
    onSave()
  }

  const canSave = title.trim() && content.trim()

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-8 pt-6 pb-4 shrink-0">
        <h1 className="text-base font-semibold text-t1">Edit Note</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-6 min-h-0">

        {/* Identity */}
        <section className="bg-surface rounded-xl border border-low p-5 space-y-4">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-t2">Identity</h3>

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-t3 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-base text-t2 text-sm rounded-lg px-3 py-2.5 border border-mid focus:border-accent focus:outline-none placeholder:text-t4"
              placeholder="Note name"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-t3 mb-2">
              Category{' '}
              <span className="text-t4 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-base text-t2 text-sm rounded-lg px-3 py-2.5 border border-mid focus:border-accent focus:outline-none placeholder:text-t4"
              placeholder="e.g. Medical, Personal…"
            />
          </div>
        </section>

        {/* Content */}
        <section className="bg-surface rounded-xl border border-low p-5 space-y-4">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-t2">Content</h3>

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-t3 mb-2">
              Body
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="w-full bg-base text-t2 text-sm font-mono rounded-lg px-3 py-2.5 border border-mid focus:border-accent focus:outline-none resize-y placeholder:text-t4"
              placeholder="Note content…"
            />
          </div>
        </section>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-low shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${canSave ? 'bg-accent' : 'bg-t4'}`} />
          <span className="text-[10px] tracking-widest uppercase text-t3">Editing Note</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs text-t2 hover:text-t1 transition-colors tracking-wide uppercase"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className={`px-5 py-1.5 text-xs font-semibold rounded-lg tracking-wide uppercase transition-colors ${
              canSave
                ? 'bg-accent hover:opacity-90 text-white'
                : 'bg-accent-dim text-t3 cursor-default'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </form>
  )
}
