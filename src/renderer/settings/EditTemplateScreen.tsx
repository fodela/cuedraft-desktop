import { useState, useEffect } from 'react'
import type { Template } from '../../shared/types'

interface EditTemplateScreenProps {
  templateId: number | null
  onSave: () => void
  onCancel: () => void
}

export function EditTemplateScreen({ templateId, onSave, onCancel }: EditTemplateScreenProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  const isEditing = templateId !== null

  useEffect(() => {
    window.cuedraft.templates.getCategories().then(setCategories)

    if (templateId !== null) {
      window.cuedraft.templates.getById(templateId).then((t) => {
        if (t) {
          setTitle(t.title)
          setContent(t.content)
          setCategory(t.category ?? '')
        }
      })
    }
  }, [templateId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    const data = {
      title: title.trim(),
      content,
      category: category.trim() || null,
      use_count: 0,
      last_used: null,
    }

    if (isEditing) {
      await window.cuedraft.templates.update({ ...data, id: templateId } as Template)
    } else {
      await window.cuedraft.templates.create(data)
    }

    onSave()
  }

  // Highlight __PLACEHOLDER__ tokens in content
  const highlightedContent = content.replace(
    /__([A-Z][A-Z0-9_]*)__/g,
    (_, name: string) => `【${name}】`
  )

  const canSave = title.trim() && content.trim()

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-8 pt-6 pb-4 shrink-0">
        <h1 className="text-base font-semibold text-zinc-100">
          {isEditing ? 'Edit Template' : 'New Template'}
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-6 min-h-0">

        {/* Identity */}
        <section className="bg-[#0b1424] rounded-xl border border-white/5 p-5 space-y-4">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
            Identity
          </h3>

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-zinc-500 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-[#070d1a] text-zinc-300 text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-blue-500/50 focus:outline-none placeholder:text-zinc-600"
              placeholder="Template name"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-zinc-500 mb-2">
              Category{' '}
              <span className="text-zinc-700 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="category-suggestions"
              className="w-full bg-[#070d1a] text-zinc-300 text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-blue-500/50 focus:outline-none placeholder:text-zinc-600"
              placeholder="e.g. Work, Personal…"
            />
            <datalist id="category-suggestions">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </section>

        {/* Content */}
        <section className="bg-[#0b1424] rounded-xl border border-white/5 p-5 space-y-4">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
            Content
          </h3>

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-zinc-500 mb-2">
              Body{' '}
              <span className="text-zinc-700 normal-case tracking-normal">
                — use __PLACEHOLDER__ for variable fields
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              className="w-full bg-[#070d1a] text-zinc-300 text-sm font-mono rounded-lg px-3 py-2.5 border border-white/10 focus:border-blue-500/50 focus:outline-none resize-y placeholder:text-zinc-600"
              placeholder="Template content…"
            />
          </div>

          {/__[A-Z]/.test(content) && (
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-zinc-500 mb-2">
                Preview
              </label>
              <div className="bg-[#070d1a] rounded-lg px-3 py-2.5 text-sm text-zinc-300 font-mono whitespace-pre-wrap border border-white/5">
                {highlightedContent}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${canSave ? 'bg-blue-500' : 'bg-zinc-600'}`} />
          <span className="text-[10px] tracking-widest uppercase text-zinc-500">
            {isEditing ? 'Editing Template' : 'New Template'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors tracking-wide uppercase"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className={`px-5 py-1.5 text-xs font-semibold rounded-lg tracking-wide uppercase transition-colors ${
              canSave
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-600/30 text-blue-400/40 cursor-default'
            }`}
          >
            {isEditing ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </form>
  )
}
