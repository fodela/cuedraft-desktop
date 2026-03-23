import { useState, useEffect, useCallback } from 'react'
import type { Template } from '../../shared/types'
import { ConfirmDialog } from './components/ConfirmDialog'

interface HomeScreenProps {
  onEdit: (id: number) => void
  onCreate: () => void
}

type Tab = 'all' | 'drafts' | 'archived'

function formatLastUsed(lastUsed: number | null): string {
  if (!lastUsed) return 'Never'
  const diff = Date.now() - lastUsed
  const hours = diff / (1000 * 60 * 60)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${Math.floor(hours)}h ago`
  const days = hours / 24
  if (days < 2) return 'Yesterday'
  if (days < 7) return `${Math.floor(days)}d ago`
  const weeks = days / 7
  if (weeks < 4) return `${Math.floor(weeks)}w ago`
  return `${Math.floor(weeks / 4)}mo ago`
}

export function HomeScreen({ onEdit, onCreate }: HomeScreenProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  const fetchTemplates = useCallback(async () => {
    const all = await window.cuedraft.templates.getAll()
    setTemplates(all)
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleDelete = async () => {
    if (!deleteTarget) return
    await window.cuedraft.templates.delete(deleteTarget.id)
    setDeleteTarget(null)
    fetchTemplates()
  }

  const filtered = templates.filter((t) =>
    search
      ? t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.category ?? '').toLowerCase().includes(search.toLowerCase())
      : true
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-6 px-8 pt-6 pb-0 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-base font-semibold text-zinc-100">My Templates</h1>
          <div className="flex items-center gap-1">
            {(['all', 'drafts', 'archived'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm capitalize transition-colors relative ${
                  activeTab === tab
                    ? 'text-blue-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cues..."
              className="bg-[#0d1a2e] border border-white/10 text-zinc-300 text-xs rounded-lg pl-8 pr-4 py-2 w-52 focus:outline-none focus:border-blue-500/50 placeholder:text-zinc-600"
            />
          </div>
          {/* Icons */}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-8 py-4 min-h-0">
        <div className="rounded-xl border border-white/5 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_160px_140px_100px_120px] bg-[#0b1424] px-4 py-3 border-b border-white/5">
            {['Title', 'Category', 'Last Used', 'Usage', 'Actions'].map((col) => (
              <div key={col} className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                {col}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-zinc-600 text-sm bg-[#0b1424]/50">
              No templates found.
            </div>
          ) : (
            filtered.map((t, i) => (
              <div
                key={t.id}
                className={`grid grid-cols-[1fr_160px_140px_100px_120px] px-4 py-3.5 items-center group hover:bg-white/[0.03] transition-colors ${
                  i < filtered.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                {/* Title */}
                <div className="min-w-0 pr-4">
                  <div className="text-sm font-medium text-zinc-200 truncate">{t.title}</div>
                  <div className="text-xs text-zinc-600 truncate mt-0.5">
                    {t.content.slice(0, 50).replace(/\n/g, ' ')}
                  </div>
                </div>

                {/* Category */}
                <div>
                  {t.category ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border border-zinc-600 text-zinc-400 bg-transparent">
                      {t.category}
                    </span>
                  ) : (
                    <span className="text-zinc-700 text-xs">—</span>
                  )}
                </div>

                {/* Last Used */}
                <div className="text-sm text-zinc-400">
                  {formatLastUsed(t.last_used)}
                </div>

                {/* Usage */}
                <div className="text-sm text-zinc-300 font-mono">
                  {t.use_count.toLocaleString()}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(t.id)}
                    className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-100 rounded hover:bg-white/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="px-2.5 py-1 text-xs text-red-500 hover:text-red-400 rounded hover:bg-white/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-2 gap-4 px-8 pb-4 shrink-0">
        {/* Global Shortcuts */}
        <div className="bg-[#0b1424] rounded-xl border border-white/5 p-5">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-4">
            Global Shortcuts
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Trigger Menu</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 text-xs bg-[#162040] text-blue-300 rounded border border-blue-900/50">Ctrl</kbd>
                <span className="text-zinc-600 text-xs">+</span>
                <kbd className="px-2 py-1 text-xs bg-[#162040] text-blue-300 rounded border border-blue-900/50">Shift</kbd>
                <span className="text-zinc-600 text-xs">+</span>
                <kbd className="px-2 py-1 text-xs bg-[#162040] text-blue-300 rounded border border-blue-900/50">Space</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Open Settings</span>
              <kbd className="px-2 py-1 text-xs bg-[#162040] text-blue-300 rounded border border-blue-900/50">Tray menu</kbd>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#0b1424] rounded-xl border border-white/5 p-5">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-4">
            System Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-xs text-zinc-400 shrink-0">Ready</span>
            </div>
            <p className="text-xs text-zinc-500">
              All data stored locally · No network calls · Privacy-first
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-white/5 shrink-0">
        <span className="text-[10px] tracking-widest uppercase text-zinc-700">
          © 2024 CueDraft Desktop
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] tracking-widest uppercase text-zinc-600">System Ready</span>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={onCreate}
        className="fixed bottom-6 right-6 w-11 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Template"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
